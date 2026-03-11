import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getPostCities, 
  getPosts, 
  getPost, 
  addPost, 
  updatePost, 
  deletePost 
} from "./post.controller.js";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";


const delay = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms));


vi.mock("../lib/prisma.js", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    savedPost: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(), 
    },
    rental: {
      findFirst: vi.fn(),
      findMany: vi.fn(),   
      deleteMany: vi.fn(), 
    },
    payment: {
      deleteMany: vi.fn(),
    },
    maintenanceRequest: {
      deleteMany: vi.fn(), 
    }
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("White Box Testing: Post Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  //getPostCities
  
  describe("getPostCities", () => {
    it("Branch 1: Successfully fetches and maps unique cities", async () => {
      const req = {};
      const res = mockResponse();

      prisma.post.findMany.mockResolvedValueOnce([
        { city: "London" },
        { city: "Paris" }
      ]);

      await getPostCities(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        select: { city: true },
        distinct: ['city']
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(["London", "Paris"]);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = {};
      const res = mockResponse();
      prisma.post.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getPostCities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch cities" });
    });
  });

  // getPosts
  
  describe("getPosts", () => {
    it("Branch 1: Successfully fetches posts with case-insensitive city filter", async () => {
      const req = { query: { city: "bangkok", minPrice: "100", maxPrice: "1000", bedroom: "2" } };
      const res = mockResponse();

      prisma.post.findMany.mockResolvedValueOnce([{ id: "post1", city: "Bangkok" }]);

      await getPosts(req, res);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { contains: "bangkok", mode: "insensitive" },
            bedroom: 2,
            price: { gte: 100, lte: 1000 }
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { query: {} };
      const res = mockResponse();
      prisma.post.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getPosts(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

 // getPost (Single Post)
  
  describe("getPost", () => {
    it("Branch 1: Returns 404 if post does not exist", async () => {
      const req = { params: { id: "ghost_post" } };
      const res = mockResponse();
      prisma.post.findUnique.mockResolvedValueOnce(null);

      await getPost(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    });

    it("Branch 2: Returns post with false flags if NO token is provided", async () => {
      const req = { params: { id: "post1" }, cookies: {} };
      const res = mockResponse();
      const mockPost = { id: "post1", title: "Test" };
      prisma.post.findUnique.mockResolvedValueOnce(mockPost);

      await getPost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ...mockPost, isSaved: false, isTenant: false });
    });

    it("Branch 3: Returns post with false flags if token is INVALID", async () => {
      const req = { params: { id: "post1" }, cookies: { token: "bad_token" } };
      const res = mockResponse();
      const mockPost = { id: "post1" };
      
      prisma.post.findUnique.mockResolvedValueOnce(mockPost);
     
      jwt.verify.mockImplementationOnce((token, secret, callback) => callback(new Error("Invalid token"), null));

      await getPost(req, res);
      
    
      await delay(); 

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ...mockPost, isSaved: false, isTenant: false });
    });

    it("Branch 4: Returns post with personalized flags if token is VALID", async () => {
      const req = { params: { id: "post1" }, cookies: { token: "good_token" } };
      const res = mockResponse();
      const mockPost = { id: "post1" };
      
      prisma.post.findUnique.mockResolvedValueOnce(mockPost);
      jwt.verify.mockImplementationOnce((token, secret, callback) => callback(null, { id: "user1" }));
      
      prisma.savedPost.findUnique.mockResolvedValueOnce({ id: "saved1" }); 
      prisma.rental.findFirst.mockResolvedValueOnce(null); 

      await getPost(req, res);

      await delay();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ...mockPost, isSaved: true, isTenant: false });
    });
  });

 //addPost
  
  describe("addPost", () => {
    it("Branch 1: Successfully creates a post with flat data structure", async () => {
      const req = { 
        userId: "owner1", 
        body: { 
          title: "New House", 
          price: 500,
          desc: "Nice place", 
          size: 1000 
        } 
      };
      const res = mockResponse();

      prisma.post.create.mockResolvedValueOnce({ id: "post1", title: "New House" });

      await addPost(req, res);

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          title: "New House",
          price: 500,
          desc: "Nice place",
          size: 1000,
          userId: "owner1"
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { userId: "owner1", body: {} };
      const res = mockResponse();
      prisma.post.create.mockRejectedValueOnce(new Error("DB Error"));

      await addPost(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // updatePost
  
  describe("updatePost", () => {
    it("Branch 1: Returns 404 if post not found", async () => {
      const req = { params: { id: "ghost" }, userId: "user1", body: {} };
      const res = mockResponse();
      prisma.post.findUnique.mockResolvedValueOnce(null);

      await updatePost(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("Branch 2: Returns 403 if user is not authorized", async () => {
      const req = { params: { id: "post1" }, userId: "hacker1", body: {} };
      const res = mockResponse();
      prisma.post.findUnique.mockResolvedValueOnce({ id: "post1", userId: "owner1" });

      await updatePost(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("Branch 3: Updates successfully", async () => {
      
      const req = { 
        params: { id: "post1" }, 
        userId: "owner1", 
        body: { title: "Updated", desc: "Updated desc" } 
      };
      const res = mockResponse();

      prisma.post.findUnique.mockResolvedValueOnce({ id: "post1", userId: "owner1" });
      prisma.post.update.mockResolvedValueOnce({ id: "post1" });

      await updatePost(req, res);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: "post1" },
        data: { title: "Updated", desc: "Updated desc" }
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // deletePost
  
  describe("deletePost", () => {
    it("Branch 1: Returns 404 if post not found", async () => {
      const req = { params: { id: "ghost" }, userId: "owner1" };
      const res = mockResponse();
      prisma.post.findUnique.mockResolvedValueOnce(null);

      await deletePost(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("Branch 2: Returns 403 if user is not authorized", async () => {
      const req = { params: { id: "post1" }, userId: "hacker1" };
      const res = mockResponse();
      prisma.post.findUnique.mockResolvedValueOnce({ id: "post1", userId: "owner1" });

      await deletePost(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("Branch 3: Returns 400 if property is currently rented (isAvailable is false)", async () => {
      const req = { params: { id: "post1" }, userId: "owner1" };
      const res = mockResponse();
      prisma.post.findUnique.mockResolvedValueOnce({ id: "post1", userId: "owner1", isAvailable: false });

      await deletePost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Cannot delete a property that is currently rented!" });
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });

    it("Branch 4: Successfully deletes available post", async () => {
      const req = { params: { id: "post1" }, userId: "owner1" };
      const res = mockResponse();
      
     
      prisma.post.findUnique.mockResolvedValueOnce({ id: "post1", userId: "owner1", isAvailable: true });
      prisma.rental.findMany.mockResolvedValueOnce([{ id: "rental1" }]); 
      prisma.payment.deleteMany.mockResolvedValueOnce({}); 
      prisma.savedPost.deleteMany.mockResolvedValueOnce({});
      prisma.maintenanceRequest.deleteMany.mockResolvedValueOnce({});
      prisma.rental.deleteMany.mockResolvedValueOnce({});

      await deletePost(req, res);

     
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: "post1" } });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});