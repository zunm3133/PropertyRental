import { describe, it, expect, vi, beforeEach } from "vitest";
import { getChats, getChat, addChat, readChat } from "./chat.controller.js";
import prisma from "../lib/prisma.js";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    chat: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("White Box Testing: Chat Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // getChats
  
  describe("getChats", () => {
    it("Branch 1: Successfully fetches chats and attaches receiver info", async () => {
      const req = { userId: "userA" };
      const res = mockResponse();

      const mockChats = [
        { id: "chat1", userIDs: ["userA", "userB"] },
      ];
      prisma.chat.findMany.mockResolvedValueOnce(mockChats);

      const mockReceiver = { id: "userB", username: "Bob", avatar: "bob.png" };
      prisma.user.findUnique.mockResolvedValueOnce(mockReceiver);

      await getChats(req, res);

      expect(prisma.chat.findMany).toHaveBeenCalledWith({
        where: { userIDs: { hasSome: ["userA"] } },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "userB" },
        select: { id: true, username: true, avatar: true },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { id: "chat1", userIDs: ["userA", "userB"], receiver: mockReceiver },
      ]);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { userId: "userA" };
      const res = mockResponse();

      prisma.chat.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getChats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get chats!" });
    });
  });
  
  describe("getChat", () => {
    it("Branch 1: Successfully fetches a single chat and pushes to seenBy", async () => {
      const req = { params: { id: "chat1" }, userId: "userA" };
      const res = mockResponse();

      const mockChatData = { id: "chat1", messages: [{ text: "Hello" }] };
      prisma.chat.findUnique.mockResolvedValueOnce(mockChatData);
      prisma.chat.update.mockResolvedValueOnce({}); 

      await getChat(req, res);

     
      expect(prisma.chat.findUnique).toHaveBeenCalledWith({
        where: {
          id: "chat1",
          userIDs: { hasSome: ["userA"] },
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

     
      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: "chat1" },
        data: { seenBy: { push: ["userA"] } },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockChatData);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { params: { id: "chat1" }, userId: "userA" };
      const res = mockResponse();

      prisma.chat.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      await getChat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get chat!" });
    });
  });

  // addChat
  
  describe("addChat", () => {
    it("Branch 1: Returns existing chat if one is already found", async () => {
      const req = { userId: "userA", body: { receiverId: "userB" } };
      const res = mockResponse();

      const existingChat = { id: "chat1", userIDs: ["userA", "userB"] };
      
      prisma.chat.findFirst.mockResolvedValueOnce(existingChat);

      await addChat(req, res);

      expect(prisma.chat.findFirst).toHaveBeenCalledWith({
        where: { userIDs: { hasEvery: ["userA", "userB"] } },
      });

     
      expect(prisma.chat.create).not.toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(existingChat);
    });

    it("Branch 2: Creates a NEW chat if one does not exist", async () => {
      const req = { userId: "userA", body: { receiverId: "userB" } };
      const res = mockResponse();

      
      prisma.chat.findFirst.mockResolvedValueOnce(null);
      
      const newChat = { id: "new_chat_2", userIDs: ["userA", "userB"] };
      prisma.chat.create.mockResolvedValueOnce(newChat);

      await addChat(req, res);

      expect(prisma.chat.create).toHaveBeenCalledWith({
        data: { userIDs: ["userA", "userB"] },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(newChat);
    });

    it("Branch 3: Catches errors and returns 500", async () => {
      const req = { userId: "userA", body: { receiverId: "userB" } };
      const res = mockResponse();

      prisma.chat.findFirst.mockRejectedValueOnce(new Error("DB Error"));

      await addChat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to add chat!" });
    });
  });

 // readChat
  
  describe("readChat", () => {
    it("Branch 1: Successfully updates seenBy using 'set'", async () => {
      const req = { params: { id: "chat1" }, userId: "userA" };
      const res = mockResponse();

      const updatedChat = { id: "chat1", seenBy: ["userA"] };
      prisma.chat.update.mockResolvedValueOnce(updatedChat);

      await readChat(req, res);

      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: {
          id: "chat1",
          userIDs: { hasSome: ["userA"] },
        },
      
        data: { seenBy: { set: ["userA"] } }, 
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedChat);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { params: { id: "chat1" }, userId: "userA" };
      const res = mockResponse();

      prisma.chat.update.mockRejectedValueOnce(new Error("DB Error"));

      await readChat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to read chat!" });
    });
  });
});