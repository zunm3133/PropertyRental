import prisma from "../lib/prisma.js";

const getMonths = (start, end) => {
  const dates = [];
  let current = new Date(start);
  const finish = new Date(end);

  while (current < finish) {
    dates.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return dates;
};

export const getRentals = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const rentals = await prisma.rental.findMany({
      where: {
        OR: [{ tenantId: tokenUserId }, { ownerId: tokenUserId }],
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
    res.status(200).json(rentals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get rentals" });
  }
};

export const getRental = async (req, res) => {
  const { id } = req.params;
  try {
    const rental = await prisma.rental.findUnique({
      where: { id },
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
    res.status(200).json(rental);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get rental" });
  }
};

export const addRental = async (req, res) => {
  const { postId, ownerId } = req.body;
  const tenantId = req.userId;
  try {
    const newRental = await prisma.rental.create({
      data: {
        postId,
        ownerId,
        tenantId,
        status: "pending"
      }
    });
    res.status(200).json(newRental);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create rental" });
  }
};

export const updateRentalStatus = async (req, res) => {
  const { id } = req.params;
  
  const { status, startDate, endDate, price, ownerLegalName, tenantLegalName } = req.body; 

  console.log("Status:", status);
  console.log("Dates Received:", startDate, endDate);
  console.log("Legal Names:", ownerLegalName, tenantLegalName);

  try {
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: { 
        status, 
        startDate: startDate ? new Date(startDate) : undefined, 
        endDate: endDate ? new Date(endDate) : undefined,
        
        ownerLegalName: ownerLegalName || undefined,
        tenantLegalName: tenantLegalName || undefined,
      },
    });

    if (status === "accepted" && startDate && endDate) {
      console.log("Logic triggered: Generating payments...");
      const months = getMonths(startDate, endDate);
      console.log("Total months to create:", months.length);

      const paymentPromises = months.map((date) => {
        return prisma.payment.create({
          data: {
            date: date,
            amount: parseInt(price) || 0,
            rentalId: id,
            status: "pending",
          },
        });
      });
      await Promise.all(paymentPromises);
      console.log("Payments successfully saved to DB.");
    }

    res.status(200).json(updatedRental);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ message: "Failed to update rental status" });
  }
};


export const updatePaymentStatus = async (req, res) => {
  const { id } = req.params; 
  const { status } = req.body; 

  try {
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status },
    });
    res.status(200).json(updatedPayment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update payment" });
  }
};