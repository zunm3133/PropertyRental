import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getAdminData, 
  createUser, 
  deleteUser, 
  updatePost, 
  toggleAdminStatus 
} from "./admin.controller.js";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    user: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    post: { findMany: vi.fn(), delete: vi.fn(), update: vi.fn() },
    feedback: { findMany: vi.fn(), delete: vi.fn() },
    maintenanceRequest: { findMany: vi.fn(), delete: vi.fn(), update: vi.fn() },
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

describe("White Box Testing: Admin Controller", () => {
  beforeEach(() => {
  
    vi.resetAllMocks(); 
  });

  describe("getAdminData Logic Gates", () => {
    it("Logic Check: Forces isAvailable to false when active rentals exist", async () => {
      const req = {};
      const res = mockResponse();

      prisma.user.findMany.mockResolvedValue([]);
      prisma.feedback.findMany.mockResolvedValue([]);
      prisma.maintenanceRequest.findMany.mockResolvedValue([]);
      
      
      prisma.post.findMany.mockResolvedValue([{
        id: "p1",
        isAvailable: true, 
        rentals: [{ status: "accepted" }] 
      }]);

      await getAdminData(req, res);

      const responseData = res.json.mock.calls[0][0];
      
      expect(responseData.posts[0].isAvailable).toBe(false);
    });

    it("Catches errors and returns 500", async () => {
      const req = {};
      const res = mockResponse();
      prisma.user.findMany.mockRejectedValue(new Error("DB Error"));
      await getAdminData(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("User Creation & Security", () => {
    it("Verifies password hashing and data destructuring", async () => {
      const req = { body: { username: "admin", email: "a@a.com", password: "123", isAdmin: true } };
      const res = mockResponse();

      bcrypt.hash.mockResolvedValue("hashed_secret");
      prisma.user.create.mockResolvedValue({ id: "u1", password: "hashed_secret", username: "admin" });

      await createUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("123", 10);
      
     
      const responseData = res.json.mock.calls[0][0]; 
      
      
      expect(responseData).not.toHaveProperty("password");
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("Role-Based Constraints", () => {
    it("Blocks self-deletion (Logic Path Check)", async () => {
      const req = { params: { id: "sameID" }, userId: "sameID" };
      const res = mockResponse();

      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it("Blocks self-role-change (Logic Path Check)", async () => {
      const req = { params: { id: "sameID" }, userId: "sameID" };
      const res = mockResponse();

      await toggleAdminStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "You cannot change your own admin status!" });
    });
  });

  describe("Data Transformation Verification", () => {
    it("Verifies Type Casting in updatePost", async () => {
      const req = { 
        params: { id: "p1" }, 
        body: { price: "2500", isAvailable: "true", title: "Test", address: "Loc" } 
      };
      const res = mockResponse();

      await updatePost(req, res);

      
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { price: 2500, isAvailable: true, title: "Test", address: "Loc" },
      });
    });
  });
});