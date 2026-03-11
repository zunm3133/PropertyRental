import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getRentals, 
  getRental, 
  addRental, 
  updateRentalStatus, 
  updatePaymentStatus 
} from "./rental.controller.js";
import prisma from "../lib/prisma.js";

// --- MOCK DEPENDENCIES ---
vi.mock("../lib/prisma.js", () => ({
  default: {
    rental: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
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

describe("White Box Testing: Rental Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // getRentals
  describe("getRentals", () => {
    it("Branch 1: Successfully fetches rentals for user (as tenant or owner) including relations", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();

      const mockRentals = [{ id: "rental1", post: {}, payments: [] }];
      prisma.rental.findMany.mockResolvedValueOnce(mockRentals);

      await getRentals(req, res);

      expect(prisma.rental.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ tenantId: "user1" }, { ownerId: "user1" }],
        },
        include: { 
          post: true, 
          payments: true,
          tenant: {
            select: {
              id: true,
              username: true,
              avatar: true,
              email: true
            }
          } 
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRentals);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { userId: "user1" };
      const res = mockResponse();

      prisma.rental.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getRentals(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get rentals" });
    });
  });

  //getRental (Single)
  describe("getRental", () => {
    it("Branch 1: Successfully fetches a single rental with relations", async () => {
      const req = { params: { id: "rental1" } };
      const res = mockResponse();

      const mockRental = { id: "rental1", post: {}, payments: [] };
      prisma.rental.findUnique.mockResolvedValueOnce(mockRental);

      await getRental(req, res);

      expect(prisma.rental.findUnique).toHaveBeenCalledWith({
        where: { id: "rental1" },
        include: { 
          post: true, 
          payments: true,
          tenant: {
            select: {
              id: true,
              username: true,
              avatar: true,
              email: true
            }
          }
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRental);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { params: { id: "rental1" } };
      const res = mockResponse();

      prisma.rental.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      await getRental(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to get rental" });
    });
  });

  // addRental
  describe("addRental", () => {
    it("Branch 1: Successfully creates a new rental with 'pending' status", async () => {
      const req = { 
        userId: "tenant1", 
        body: { postId: "post1", ownerId: "owner1" } 
      };
      const res = mockResponse();

      const newRental = { id: "rental1", status: "pending" };
      prisma.rental.create.mockResolvedValueOnce(newRental);

      await addRental(req, res);

      expect(prisma.rental.create).toHaveBeenCalledWith({
        data: {
          postId: "post1",
          ownerId: "owner1",
          tenantId: "tenant1",
          status: "pending"
        }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(newRental);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { userId: "tenant1", body: {} };
      const res = mockResponse();

      prisma.rental.create.mockRejectedValueOnce(new Error("DB Error"));

      await addRental(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to create rental" });
    });
  });

  //updateRentalStatus
  describe("updateRentalStatus", () => {
    it("Branch 1: Updates status WITHOUT generating payments (e.g., status is 'rejected' or dates missing)", async () => {
      const req = { 
        params: { id: "rental1" }, 
        body: { status: "rejected" } 
      };
      const res = mockResponse();

      prisma.rental.update.mockResolvedValueOnce({ id: "rental1", status: "rejected" });

      await updateRentalStatus(req, res);

      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: "rental1" },
        data: { 
          status: "rejected", 
          startDate: undefined, 
          endDate: undefined,
          ownerLegalName: undefined,
          tenantLegalName: undefined
        }
      });
      
      
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 2: Updates status to 'accepted' AND generates payments for the correct number of months", async () => {
      const req = { 
        params: { id: "rental1" }, 
        body: { 
          status: "accepted", 
          startDate: "2026-01-01T00:00:00.000Z", 
          endDate: "2026-03-01T00:00:00.000Z", 
          price: "1500" 
        } 
      };
      const res = mockResponse();

      prisma.rental.update.mockResolvedValueOnce({ id: "rental1", status: "accepted" });
      prisma.payment.create.mockResolvedValue({}); 

      await updateRentalStatus(req, res);

      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: "rental1" },
        data: { 
          status: "accepted", 
          startDate: new Date("2026-01-01T00:00:00.000Z"), 
          endDate: new Date("2026-03-01T00:00:00.000Z"),
          ownerLegalName: undefined,
          tenantLegalName: undefined
        }
      });

    
      expect(prisma.payment.create).toHaveBeenCalledTimes(2);
      
      
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 1500,
          rentalId: "rental1",
          status: "pending",
        }),
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 3: Catches errors and returns 500", async () => {
      const req = { params: { id: "rental1" }, body: {} };
      const res = mockResponse();

      prisma.rental.update.mockRejectedValueOnce(new Error("DB Error"));

      await updateRentalStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to update rental status" });
    });
  });

  // updatePaymentStatus
  describe("updatePaymentStatus", () => {
    it("Branch 1: Successfully updates payment status to 'paid'", async () => {
      const req = { 
        params: { id: "payment123" }, 
        body: { status: "paid" } 
      };
      const res = mockResponse();

      prisma.payment.update.mockResolvedValueOnce({ id: "payment123", status: "paid" });

      await updatePaymentStatus(req, res);

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "payment123" },
        data: { status: "paid" }
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Branch 2: Catches errors and returns 500", async () => {
      const req = { params: { id: "payment123" }, body: {} };
      const res = mockResponse();

      prisma.payment.update.mockRejectedValueOnce(new Error("DB Error"));

      await updatePaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to update payment" });
    });
  });
});