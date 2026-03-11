import { describe, it, expect, vi, beforeEach } from "vitest";
import { shouldBeLoggedIn, shouldBeAdmin } from "./test.controller.js";
import jwt from "jsonwebtoken";


const delay = (ms = 15) => new Promise((resolve) => setTimeout(resolve, ms));

// --- MOCK DEPENDENCIES ---
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

describe("White Box Testing: Test Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // shouldBeLoggedIn
  
  describe("shouldBeLoggedIn", () => {
    it("Branch 1: Successfully returns 200 and logs userId", async () => {
      const req = { userId: "user123" };
      const res = mockResponse();

      await shouldBeLoggedIn(req, res);

      expect(console.log).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "You are Authenticated" });
    });
  });

 //shouldBeAdmin
  
  describe("shouldBeAdmin", () => {
    it("Branch 1: Returns 401 if NO token is provided in cookies", async () => {
      const req = { cookies: {} }; 
      const res = mockResponse();

      await shouldBeAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "Not Authenticated!" });
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("Branch 2: Returns 403 if token is INVALID", async () => {
      const req = { cookies: { token: "bad_token" } };
      const res = mockResponse();

    
      jwt.verify.mockImplementationOnce((token, secret, callback) => callback(new Error("Invalid token"), null));

      await shouldBeAdmin(req, res);
      
      await delay();

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Token is not Valid!" });
    });

    it("Branch 3: Returns 403 if token is valid but user is NOT an admin", async () => {
      const req = { cookies: { token: "good_token" } };
      const res = mockResponse();

      
      jwt.verify.mockImplementationOnce((token, secret, callback) => callback(null, { id: "user1", isAdmin: false }));

      await shouldBeAdmin(req, res);

      await delay();

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Not authorized!" });
    });

    it("Branch 4: Returns 200 if token is valid AND user IS an admin", async () => {
      const req = { cookies: { token: "good_token" } };
      const res = mockResponse();

     
      jwt.verify.mockImplementationOnce((token, secret, callback) => callback(null, { id: "admin1", isAdmin: true }));

      await shouldBeAdmin(req, res);

      await delay(); 

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "You are Authenticated" });
    });
  });
});