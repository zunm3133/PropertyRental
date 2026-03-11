import { describe, it, expect, vi, beforeEach } from "vitest";
import { register, login, logout, forgotPassword, resetPassword } from "./auth.controller.js"; 
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
  },
}));


const mockSendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => "mock_crypto_token"),
    })),
  },
}));

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  return res;
};

describe("White Box Testing: Auth Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Register
  
  describe("register", () => {
    it("Branch 1: Successfully hashes password and creates user", async () => {
      const req = { body: { username: "testuser", email: "test@test.com", password: "password123" } };
      const res = mockResponse();

      bcrypt.hash.mockResolvedValueOnce("hashedPassword123");
      prisma.user.create.mockResolvedValueOnce({ id: "user1", username: "testuser" });

      await register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { username: "testuser", email: "test@test.com", password: "hashedPassword123" },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "User created successfully" });
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { body: { username: "testuser", email: "existing@test.com", password: "password123" } };
      const res = mockResponse();

      bcrypt.hash.mockResolvedValueOnce("hash");
      prisma.user.create.mockRejectedValueOnce(new Error("Unique constraint failed"));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to create user!" });
    });
  });

  // Forgot Password
 
  describe("forgotPassword", () => {
    it("Branch 1: Returns 404 if email does not exist", async () => {
      const req = { body: { email: "ghost@test.com" } };
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValueOnce(null);

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("Branch 2: Generates token, updates DB, and sends email successfully", async () => {
      const req = { body: { email: "realuser@test.com" } };
      const res = mockResponse();
      
      const mockUser = { id: "user123", email: "realuser@test.com" };
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      bcrypt.hash.mockResolvedValueOnce("hashed_reset_token");
      prisma.user.update.mockResolvedValueOnce({});
      mockSendMail.mockResolvedValueOnce({});

      await forgotPassword(req, res);

      // Verify token logic
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(bcrypt.hash).toHaveBeenCalledWith("mock_crypto_token", 10);

      // Verify database update
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: "realuser@test.com" },
        data: expect.objectContaining({
          resetToken: "hashed_reset_token",
          resetTokenExpiry: expect.any(Date)
        }),
      });

      // Verify email sending
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: "realuser@test.com",
        subject: "Password Reset Request",
        html: expect.stringContaining("mock_crypto_token"),
      }));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Reset link sent to email" });
    });

    it("Branch 3: Catches errors and returns 500", async () => {
      const req = { body: { email: "realuser@test.com" } };
      const res = mockResponse();

      prisma.user.findUnique.mockRejectedValueOnce(new Error("Database crash"));

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  
  describe("resetPassword", () => {
    it("Branch 1: Returns 400 if user or token data is missing", async () => {
      const req = { body: { userId: "user1", token: "tok123", newPassword: "newPass" } };
      const res = mockResponse();

      
      prisma.user.findUnique.mockResolvedValueOnce({ id: "user1", resetToken: null });

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    it("Branch 2: Returns 400 if token has expired", async () => {
      const req = { body: { userId: "user1", token: "tok123", newPassword: "newPass" } };
      const res = mockResponse();

      const pastDate = new Date(Date.now() - 10000); 
      prisma.user.findUnique.mockResolvedValueOnce({ 
        id: "user1", 
        resetToken: "hashed_token", 
        resetTokenExpiry: pastDate 
      });

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Token has expired" });
    });

    it("Branch 3: Returns 400 if token does not match DB hash", async () => {
      const req = { body: { userId: "user1", token: "wrong_token", newPassword: "newPass" } };
      const res = mockResponse();

      const futureDate = new Date(Date.now() + 3600000);
      prisma.user.findUnique.mockResolvedValueOnce({ 
        id: "user1", resetToken: "hashed_token", resetTokenExpiry: futureDate 
      });
      bcrypt.compare.mockResolvedValueOnce(false); // Token mismatch

      await resetPassword(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith("wrong_token", "hashed_token");
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    });

    it("Branch 4: Successfully updates password and clears tokens", async () => {
      const req = { body: { userId: "user1", token: "correct_token", newPassword: "newPass" } };
      const res = mockResponse();

      const futureDate = new Date(Date.now() + 3600000);
      prisma.user.findUnique.mockResolvedValueOnce({ 
        id: "user1", resetToken: "hashed_token", resetTokenExpiry: futureDate 
      });
      bcrypt.compare.mockResolvedValueOnce(true); // Token matches
      bcrypt.hash.mockResolvedValueOnce("new_hashed_password");

      await resetPassword(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("newPass", 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: {
          password: "new_hashed_password",
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Password updated successfully" });
    });
  });

  // Login
  
  describe("login", () => {
    it("Branch 1: Fails if user does not exist (400)", async () => {
      const req = { body: { username: "ghost", password: "123" } };
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValueOnce(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid Credentials!" });
    });

    it("Branch 2: Fails if password does not match (400)", async () => {
      const req = { body: { username: "realuser", password: "wrongpassword" } };
      const res = mockResponse();

      prisma.user.findUnique.mockResolvedValueOnce({ id: "u1", password: "hashedPassword" });
      bcrypt.compare.mockResolvedValueOnce(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid Credentials!" });
    });

    it("Branch 3: Succeeds, generates token, and sets cookie", async () => {
      const req = { body: { username: "realuser", password: "correctpassword" } };
      const res = mockResponse();
      
      const mockUser = { id: "u1", username: "realuser", password: "hashedPassword", isAdmin: true };

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValueOnce("mocked_jwt_token");

      await login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "u1", isAdmin: true },
        process.env.JWT_SECRET_KEY,
        { expiresIn: 1000 * 60 * 60 * 24 * 7 } 
      );
      
      expect(res.cookie).toHaveBeenCalledWith("token", "mocked_jwt_token", expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.not.objectContaining({ password: "hashedPassword" }));
    });
  });

  // Logout
  
  describe("logout", () => {
    it("Branch 1: Clears the token cookie successfully", () => {
      const req = {};
      const res = mockResponse();

      logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith("token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Logout Successful" });
    });
  });
});