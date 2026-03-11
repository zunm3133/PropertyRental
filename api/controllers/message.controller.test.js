import { describe, it, expect, vi, beforeEach } from "vitest";
import { addMessage, getFlaggedMessages, unflagMessage } from "./message.controller.js";
import prisma from "../lib/prisma.js";
import leoProfanity from "leo-profanity";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    chat: { findUnique: vi.fn(), update: vi.fn() },
    message: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  },
}));


vi.mock("leo-profanity", () => ({
  default: {
    loadDictionary: vi.fn(),
    check: vi.fn(),
  },
}));

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("White Box Testing: Message Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  
  
  describe("addMessage", () => {
    it("Branch 1: Blocks message creation if user is RESTRICTED (403)", async () => {
      const req = { params: { chatId: "chat1" }, body: { text: "Hello" }, userId: "banned_user" };
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValueOnce({ id: "banned_user", isRestricted: true });

      await addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "You are restricted from sending messages." });
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it("Branch 2: Blocks message creation if chat doesn't belong to user (404)", async () => {
      const req = { params: { chatId: "chat1" }, body: { text: "Hello" }, userId: "normal_user" };
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValueOnce({ id: "normal_user", isRestricted: false });
      prisma.chat.findUnique.mockResolvedValueOnce(null); 

      await addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Chat not found!" });
    });

    it("Branch 3: Successfully creates a CLEAN message (isFlagged: false)", async () => {
      const req = { params: { chatId: "chat1" }, body: { text: "Hello friend" }, userId: "normal_user" };
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValueOnce({ id: "normal_user", isRestricted: false });
      leoProfanity.check.mockReturnValueOnce(false); 
      prisma.chat.findUnique.mockResolvedValueOnce({ id: "chat1" });
      
      const mockMessage = { id: "msg1", text: "Hello friend", isFlagged: false };
      prisma.message.create.mockResolvedValueOnce(mockMessage);

      await addMessage(req, res);

      expect(leoProfanity.loadDictionary).toHaveBeenCalledWith('en');
      expect(leoProfanity.check).toHaveBeenCalledWith("Hello friend");

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { text: "Hello friend", chatId: "chat1", userId: "normal_user", isFlagged: false },
      });

      expect(prisma.chat.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });

    it("Branch 4: Successfully creates a PROFANE message but FLAGS it (isFlagged: true)", async () => {
      const req = { params: { chatId: "chat1" }, body: { text: "Bad word" }, userId: "normal_user" };
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValueOnce({ id: "normal_user", isRestricted: false });
      leoProfanity.check.mockReturnValueOnce(true); 
      prisma.chat.findUnique.mockResolvedValueOnce({ id: "chat1" });
      
      const mockMessage = { id: "msg2", text: "Bad word", isFlagged: true };
      prisma.message.create.mockResolvedValueOnce(mockMessage);

      await addMessage(req, res);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { text: "Bad word", chatId: "chat1", userId: "normal_user", isFlagged: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 5: Catches general errors and returns 500", async () => {
      const req = { params: { chatId: "chat1" }, body: { text: "Hi" }, userId: "user1" };
      const res = mockResponse();

      prisma.user.findUnique.mockRejectedValueOnce(new Error("DB Down"));

      await addMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to add message!" });
    });
  });

  
  
  describe("getFlaggedMessages", () => {
    it("Branch 1: Successfully fetches and formats flagged messages", async () => {
      const req = {};
      const res = mockResponse();

      const dbMessages = [{
        id: "msg1",
        text: "Bad word",
        userId: "userA",
        isFlagged: true,
        chat: {
          users: [
            { id: "userA", username: "ToxicUser", email: "a@test.com", isRestricted: false },
            { id: "userB", username: "InnocentUser", email: "b@test.com", isRestricted: false }
          ]
        }
      }];
      
      prisma.message.findMany.mockResolvedValueOnce(dbMessages);

      await getFlaggedMessages(req, res);

      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{
        id: "msg1",
        text: "Bad word",
        userId: "userA",
        isFlagged: true,
        chat: expect.any(Object),
        sender: { id: "userA", username: "ToxicUser", email: "a@test.com", isRestricted: false } 
      }]);
    });

    it("Branch 2: Defaults to 'Unknown' if sender is missing from chat users", async () => {
      const req = {};
      const res = mockResponse();

      const dbMessages = [{
        id: "msg1",
        text: "Bad word",
        userId: "userGhost", 
        isFlagged: true,
        chat: { users: [{ id: "userB", username: "InnocentUser" }] }
      }];
      
      prisma.message.findMany.mockResolvedValueOnce(dbMessages);

      await getFlaggedMessages(req, res);

     
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ sender: { username: "Unknown" } })
      ]);
    });

    it("Branch 3: Catches errors and returns 500", async () => {
      const req = {};
      const res = mockResponse();
      prisma.message.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getFlaggedMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  
  
  describe("unflagMessage", () => {
    it("Branch 1: Successfully updates message isFlagged status to false", async () => {
      const req = { params: { id: "flagged_msg_123" } };
      const res = mockResponse();

      await unflagMessage(req, res);

      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: "flagged_msg_123" },
        data: { isFlagged: false }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Message marked as safe." });
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { params: { id: "flagged_msg_123" } };
      const res = mockResponse();

      prisma.message.update.mockRejectedValueOnce(new Error("Database connection lost"));

      await unflagMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to unflag message" });
    });
  });
});