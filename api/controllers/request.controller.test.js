import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  addRentalRequest, 
  addMaintenanceRequest, 
  updateRentalStatus, 
  updateMaintenanceStatus, 
  getRentals, 
  getMaintenance 
} from "./request.controller.js";
import prisma from "../lib/prisma.js";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    rental: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    maintenanceRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    post: {
      update: vi.fn(),
    },
  },
}));

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("White Box Testing: Request Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

 // addRentalRequest
  
  describe("addRentalRequest", () => {
    it("Branch 1: Successfully creates a new rental request", async () => {
      const req = { body: { postId: "post1", ownerId: "owner1" }, userId: "tenant1" };
      const res = mockResponse();

      const mockRental = { id: "rental1", postId: "post1", ownerId: "owner1", tenantId: "tenant1" };
      prisma.rental.create.mockResolvedValueOnce(mockRental);

      await addRentalRequest(req, res);

      expect(prisma.rental.create).toHaveBeenCalledWith({
        data: { postId: "post1", ownerId: "owner1", tenantId: "tenant1" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRental);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { body: {}, userId: "tenant1" };
      const res = mockResponse();

      prisma.rental.create.mockRejectedValueOnce(new Error("DB Error"));

      await addRentalRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to create rental!" });
    });
  });

  // addMaintenanceRequest
  
  describe("addMaintenanceRequest", () => {
    it("Branch 1: Successfully creates a new maintenance request", async () => {
      const req = { body: { postId: "post1", description: "Leaky roof" }, userId: "tenant1" };
      const res = mockResponse();

      const mockMaintenance = { id: "maint1", postId: "post1", description: "Leaky roof" };
      prisma.maintenanceRequest.create.mockResolvedValueOnce(mockMaintenance);

      await addMaintenanceRequest(req, res);

      expect(prisma.maintenanceRequest.create).toHaveBeenCalledWith({
        data: { postId: "post1", description: "Leaky roof", tenantId: "tenant1" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMaintenance);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { body: {}, userId: "tenant1" };
      const res = mockResponse();

      prisma.maintenanceRequest.create.mockRejectedValueOnce(new Error("DB Error"));

      await addMaintenanceRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to create maintenance request!" });
    });
  });

  //updateRentalStatus
  
  describe("updateRentalStatus", () => {
    it("Branch 1: Returns 404 if rental is not found", async () => {
      const req = { params: { id: "ghost" }, body: {} };
      const res = mockResponse();

      prisma.rental.findUnique.mockResolvedValueOnce(null);

      await updateRentalStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Rental request not found!" });
    });

    it("Branch 2: Blocks 'accepted' status if tenant has NOT signed the lease (400)", async () => {
      const req = { params: { id: "rental1" }, body: { status: "accepted" } }; 
      const res = mockResponse();

      
      prisma.rental.findUnique.mockResolvedValueOnce({ id: "rental1", signedLeaseUrl: null });

      await updateRentalStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Cannot accept: Tenant has not signed the lease yet!" });
      expect(prisma.rental.update).not.toHaveBeenCalled(); 
    });

    it("Branch 3: Updates status (e.g., 'rejected') WITHOUT triggering automation", async () => {
      const req = { params: { id: "rental1" }, body: { status: "rejected" } };
      const res = mockResponse();

      prisma.rental.findUnique.mockResolvedValueOnce({ id: "rental1", postId: "post1" });
      prisma.rental.update.mockResolvedValueOnce({ id: "rental1", postId: "post1", status: "rejected" });

      await updateRentalStatus(req, res);

      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: "rental1" },
        data: { status: "rejected" },
      });
      
      expect(prisma.post.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 4: Updates status to 'accepted' WITH signed lease AND triggers Post automation", async () => {
      const req = { 
        params: { id: "rental1" }, 
        body: { status: "accepted", signedLeaseUrl: "http://lease.pdf" } 
      };
      const res = mockResponse();

      prisma.rental.findUnique.mockResolvedValueOnce({ id: "rental1", postId: "post1", signedLeaseUrl: null });
      
      const updatedMockRental = { id: "rental1", postId: "post1", status: "accepted", signedLeaseUrl: "http://lease.pdf" };
      prisma.rental.update.mockResolvedValueOnce(updatedMockRental);
      prisma.post.update.mockResolvedValueOnce({});

      await updateRentalStatus(req, res);

      
      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: "rental1" },
        data: { status: "accepted", signedLeaseUrl: "http://lease.pdf" },
      });

     
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: "post1" }, 
        data: { isAvailable: false },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedMockRental);
    });

    it("Branch 5: Catches errors and returns 500", async () => {
      const req = { params: { id: "rental1" }, body: {} };
      const res = mockResponse();

      prisma.rental.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      await updateRentalStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to update rental status" });
    });
  });

  // updateMaintenanceStatus
  
  describe("updateMaintenanceStatus", () => {
    it("Branch 1: Returns 404 if maintenance request not found", async () => {
      const req = { params: { id: "ghost" }, body: {}, userId: "owner1" };
      const res = mockResponse();

      prisma.maintenanceRequest.findUnique.mockResolvedValueOnce(null);

      await updateMaintenanceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Request not found!" });
    });

    it("Branch 2: Returns 403 if the logged-in user is NOT the owner", async () => {
      const req = { params: { id: "maint1" }, body: { status: "resolved" }, userId: "hacker1" };
      const res = mockResponse();

      
      prisma.maintenanceRequest.findUnique.mockResolvedValueOnce({
        id: "maint1",
        post: { userId: "owner99" }
      });

      await updateMaintenanceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Not Authorized! Only owners can update status." });
      expect(prisma.maintenanceRequest.update).not.toHaveBeenCalled();
    });

    it("Branch 3: Successfully updates status if user IS the owner", async () => {
      const req = { params: { id: "maint1" }, body: { status: "resolved" }, userId: "owner1" };
      const res = mockResponse();

      prisma.maintenanceRequest.findUnique.mockResolvedValueOnce({
        id: "maint1",
        post: { userId: "owner1" } 
      });

      const updatedMaintenance = { id: "maint1", status: "resolved" };
      prisma.maintenanceRequest.update.mockResolvedValueOnce(updatedMaintenance);

      await updateMaintenanceStatus(req, res);

      expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith({
        where: { id: "maint1" },
        data: { status: "resolved" }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedMaintenance);
    });

    it("Branch 4: Catches errors and returns 500", async () => {
      const req = { params: { id: "maint1" }, body: {}, userId: "owner1" };
      const res = mockResponse();

      prisma.maintenanceRequest.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      await updateMaintenanceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to update maintenance status!" });
    });
  });

 // getRentals
  
  describe("getRentals", () => {
    it("Branch 1: Successfully fetches rentals", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();

      const mockRentals = [{ id: "rental1" }];
      prisma.rental.findMany.mockResolvedValueOnce(mockRentals);

      await getRentals(req, res);

      expect(prisma.rental.findMany).toHaveBeenCalledWith({
        where: { OR: [{ tenantId: "user1" }, { ownerId: "user1" }] },
        include: { post: true, tenant: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();
      prisma.rental.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getRentals(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // getMaintenance
 
  describe("getMaintenance", () => {
    it("Branch 1: Successfully fetches maintenance requests", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();

      const mockRequests = [{ id: "maint1" }];
      prisma.maintenanceRequest.findMany.mockResolvedValueOnce(mockRequests);

      await getMaintenance(req, res);

      expect(prisma.maintenanceRequest.findMany).toHaveBeenCalledWith({
        where: { OR: [{ tenantId: "user1" }, { post: { userId: "user1" } }] },
        include: { post: true },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();
      prisma.maintenanceRequest.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getMaintenance(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});