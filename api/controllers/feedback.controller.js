import prisma from "../lib/prisma.js";

export const addFeedback = async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const newFeedback = await prisma.feedback.create({
      data: { name, email, message },
    });
    res.status(200).json(newFeedback);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
};

export const getFeedbacks = async (req, res) => {
  try {
    
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(feedbacks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get feedbacks" });
  }
};