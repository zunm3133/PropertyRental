import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser, 
  savePost, 
  profilePosts, 
  restrictUser, 
  getNotificationNumber, 
  unrestrictUser 
} from "./user.controller.js";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    savedPost: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    post: { findMany: vi.fn() },
    rental: { findMany: vi.fn() },
    chat: { count: vi.fn() },
  },
}));

vi.mock("bcrypt", () => ({
  default: { hash: vi.fn() },
}));

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("White Box Testing: User Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // getUsers & getUser
  
  describe("getUsers and getUser", () => {
    it("getUsers - Branch 1: Success", async () => {
      const req = {};
      const res = mockResponse();
      prisma.user.findMany.mockResolvedValueOnce([{ id: "1", username: "test" }]);

      await getUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: "1", username: "test" }]);
    });

    it("getUsers - Branch 2: Catches errors", async () => {
      const req = {}; const res = mockResponse();
      prisma.user.findMany.mockRejectedValueOnce(new Error("DB Error"));
      
      await getUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get users!" });
    });

    it("getUser - Branch 1: Success", async () => {
      const req = { params: { id: "user1" } };
      const res = mockResponse();
      prisma.user.findUnique.mockResolvedValueOnce({ id: "user1", username: "test" });

      await getUser(req, res);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user1" } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("getUser - Branch 2: Catches errors", async () => {
      const req = { params: { id: "user1" } }; const res = mockResponse();
      prisma.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));
      
      await getUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get user!" });
    });
  });

  // updateUser
  
  describe("updateUser", () => {
    it("Branch 1: Fails if user tries to update someone else's profile (403)", async () => {
      const req = { params: { id: "user1" }, userId: "hacker99", body: {} };
      const res = mockResponse();

      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Not Authorized!" });
    });

    it("Branch 2: Updates profile WITHOUT password change", async () => {
      const req = { 
        params: { id: "user1" }, userId: "user1", 
        body: { username: "new_name", avatar: "new_pic.jpg" } 
      };
      const res = mockResponse();

      prisma.user.update.mockResolvedValueOnce({ id: "user1", username: "new_name", password: "old_hash" });

      await updateUser(req, res);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { username: "new_name", avatar: "new_pic.jpg" }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "user1", username: "new_name" }); // Excludes password
    });

    it("Branch 3: Hashes new password before updating profile", async () => {
      const req = { 
        params: { id: "user1" }, userId: "user1", 
        body: { password: "new_secure_password" } 
      };
      const res = mockResponse();

      bcrypt.hash.mockResolvedValueOnce("hashed_new_password");
      prisma.user.update.mockResolvedValueOnce({ id: "user1", password: "hashed_new_password" });

      await updateUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("new_secure_password", 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { password: "hashed_new_password" }
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 4: Catches errors (500)", async () => {
      const req = { params: { id: "user1" }, userId: "user1", body: {} };
      const res = mockResponse();
      prisma.user.update.mockRejectedValueOnce(new Error("DB Down"));

      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to update users!" });
    });
  });

  //deleteUser
  
  describe("deleteUser", () => {
    it("Branch 1: Blocks unauthorized deletion (403)", async () => {
      const req = { params: { id: "target_user" }, userId: "attacker" };
      const res = mockResponse();

      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("Branch 2: Successfully deletes user", async () => {
      const req = { params: { id: "user1" }, userId: "user1" };
      const res = mockResponse();

      await deleteUser(req, res);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user1" } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 3: Catches errors (500)", async () => {
      const req = { params: { id: "user1" }, userId: "user1" };
      const res = mockResponse();
      prisma.user.delete.mockRejectedValueOnce(new Error("DB Down"));

      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // savePost (Toggling logic)
  
  describe("savePost", () => {
    it("Branch 1: If post is already saved, it DELETES the saved post (Unsave)", async () => {
      const req = { body: { postId: "post1" }, userId: "user1" };
      const res = mockResponse();

      prisma.savedPost.findUnique.mockResolvedValueOnce({ id: "saved1" });

      await savePost(req, res);

      expect(prisma.savedPost.delete).toHaveBeenCalledWith({ where: { id: "saved1" } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Post removed from saved list" });
    });

    it("Branch 2: If post is NOT saved, it CREATES a new saved post (Save)", async () => {
      const req = { body: { postId: "post1" }, userId: "user1" };
      const res = mockResponse();

      prisma.savedPost.findUnique.mockResolvedValueOnce(null);

      await savePost(req, res);

      expect(prisma.savedPost.create).toHaveBeenCalledWith({
        data: { userId: "user1", postId: "post1" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Post saved" });
    });

    it("Branch 3: Catches errors (500)", async () => {
      const req = { body: { postId: "post1" }, userId: "user1" };
      const res = mockResponse();
      prisma.savedPost.findUnique.mockRejectedValueOnce(new Error("DB Down"));

      await savePost(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to delete users!" });
    });
  });

  // profilePosts
  
  describe("profilePosts", () => {
    it("Branch 1: Successfully aggregates user posts, saved posts, and rentals (with payments)", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();

      prisma.post.findMany.mockResolvedValueOnce([{ id: "post_created_by_user" }]);
      prisma.savedPost.findMany.mockResolvedValueOnce([
        { id: "save1", post: { id: "post_saved_by_user" } }
      ]);
      prisma.rental.findMany.mockResolvedValueOnce([
        { id: "rental1", post: { id: "rented_post" }, payments: [{ id: "pay1", amount: 500 }] }
      ]);

      await profilePosts(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith({ where: { userId: "user1" } });
      expect(prisma.rental.findMany).toHaveBeenCalledWith({
        where: { OR: [{ tenantId: "user1" }, { ownerId: "user1" }] },
        include: { post: true, payments: true }
      });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        userPosts: [{ id: "post_created_by_user" }],
        savedPosts: [{ id: "post_saved_by_user" }], 
        rentals: [{ id: "rental1", post: { id: "rented_post" }, payments: [{ id: "pay1", amount: 500 }] }]
      });
    });

    it("Branch 2: Catches errors (500)", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();
      prisma.post.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await profilePosts(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get profile posts!" });
    });
  });

  // Admin & Utility Functions
  
  describe("Admin & Utility Functions", () => {
    it("restrictUser - updates status to true", async () => {
      const req = { params: { id: "bad_user" } };
      const res = mockResponse();
      
      await restrictUser(req, res);
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "bad_user" },
        data: { isRestricted: true }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "User restricted successfully" });
    });

    it("restrictUser - Catches errors", async () => {
      const req = { params: { id: "bad_user" } };
      const res = mockResponse();
      prisma.user.update.mockRejectedValueOnce(new Error("DB Error"));
      
      await restrictUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to restrict user" });
    });

    it("unrestrictUser - updates status to false", async () => {
      const req = { params: { id: "reformed_user" } };
      const res = mockResponse();
      
      await unrestrictUser(req, res);
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "reformed_user" },
        data: { isRestricted: false }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "User restriction lifted." });
    });

    it("unrestrictUser - Catches errors", async () => {
      const req = { params: { id: "reformed_user" } };
      const res = mockResponse();
      prisma.user.update.mockRejectedValueOnce(new Error("DB Error"));
      
      await unrestrictUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to unrestrict user" });
    });

    it("getNotificationNumber - calculates unread chats", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();
      
      prisma.chat.count.mockResolvedValueOnce(3);
      
      await getNotificationNumber(req, res);
      
      expect(prisma.chat.count).toHaveBeenCalledWith({
        where: {
          userIDs: { hasSome: ["user1"] },
          NOT: { seenBy: { hasSome: ["user1"] } },
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(3);
    });

    it("getNotificationNumber - Catches errors", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();
      prisma.chat.count.mockRejectedValueOnce(new Error("DB Error"));
      
      await getNotificationNumber(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get profile posts!" });
    });
  });
});