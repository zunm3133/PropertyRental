import prisma from "../lib/prisma.js";

export const addRentalRequest = async (req, res) => {
  const { postId, ownerId } = req.body;
  try {
    const newRental = await prisma.rental.create({
      data: {
        postId,
        ownerId,
        tenantId: req.userId,
      },
    });
    res.status(200).json(newRental);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create rental!" });
  }
};

export const addMaintenanceRequest = async (req, res) => {
  const { postId, description } = req.body;
  try {
    const newMaintenance = await prisma.maintenanceRequest.create({
      data: {
        postId,
        description,
        tenantId: req.userId,
      },
    });
    res.status(200).json(newMaintenance);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create maintenance request!" });
  }
};

export const updateRentalStatus = async (req, res) => {
  const { id } = req.params;
  const { status, leaseUrl, signedLeaseUrl } = req.body;

  try {
   
    const currentRental = await prisma.rental.findUnique({ where: { id } });

    if (!currentRental) {
      return res.status(404).json({ message: "Rental request not found!" });
    }

    
    if (status === "accepted" && !currentRental.signedLeaseUrl && !signedLeaseUrl) {
      return res.status(400).json({ message: "Cannot accept: Tenant has not signed the lease yet!" });
    }

    
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status,
        ...(leaseUrl && { leaseUrl }),            
        ...(signedLeaseUrl && { signedLeaseUrl }), 
      },
    });

    if (status === "accepted") {
      await prisma.post.update({
        where: { id: updatedRental.postId },
        data: { isAvailable: false },
      });
    }

    res.status(200).json(updatedRental);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update rental status" });
  }
};

export const updateMaintenanceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const tokenUserId = req.userId; 

  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { post: true },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found!" });
    }

    if (request.post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized! Only owners can update status." });
    }

    const updatedMaintenance = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status },
    });

    res.status(200).json(updatedMaintenance);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update maintenance status!" });
  }
};

export const getRentals = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const rentals = await prisma.rental.findMany({
      where: {
        OR: [{ tenantId: tokenUserId }, { ownerId: tokenUserId }],
      },
      include: { post: true, tenant: true },
    });
    res.status(200).json(rentals);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get rentals!" });
  }
};

export const getMaintenance = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        OR: [{ tenantId: tokenUserId }, { post: { userId: tokenUserId } }],
      },
      include: { post: true },
    });
    res.status(200).json(requests);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get maintenance requests!" });
  }
};