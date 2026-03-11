import { describe, it, expect, vi, beforeEach } from "vitest";
import { addFeedback, getFeedbacks } from "./feedback.controller.js";
import prisma from "../lib/prisma.js";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    feedback: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("White Box Testing: Feedback Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // addFeedback
  
  describe("addFeedback", () => {
    it("Branch 1: Successfully creates a new feedback entry", async () => {
      const req = { 
        body: { 
          name: "John Doe", 
          email: "john@test.com", 
          message: "Great application!" 
        } 
      };
      const res = mockResponse();

      const mockFeedback = { id: "fb1", ...req.body };
      prisma.feedback.create.mockResolvedValueOnce(mockFeedback);

      await addFeedback(req, res);

      expect(prisma.feedback.create).toHaveBeenCalledWith({
        data: { 
          name: "John Doe", 
          email: "john@test.com", 
          message: "Great application!" 
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFeedback);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { body: { name: "Error User" } };
      const res = mockResponse();

      prisma.feedback.create.mockRejectedValueOnce(new Error("Database connection lost"));

      await addFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to submit feedback" });
    });
  });

  // getFeedbacks
  
  describe("getFeedbacks", () => {
    it("Branch 1: Successfully retrieves all feedback ordered by newest first", async () => {
      const req = {};
      const res = mockResponse();

      const mockFeedbacks = [
        { id: "fb2", message: "Newer feedback" },
        { id: "fb1", message: "Older feedback" },
      ];
      
      prisma.feedback.findMany.mockResolvedValueOnce(mockFeedbacks);

      await getFeedbacks(req, res);

      expect(prisma.feedback.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFeedbacks);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = {};
      const res = mockResponse();

      prisma.feedback.findMany.mockRejectedValueOnce(new Error("Database timeout"));

      await getFeedbacks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get feedbacks" });
    });
  });
});