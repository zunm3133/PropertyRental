import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

export const getAdminData = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, email: true, createdAt: true, isAdmin: true , isRestricted: true}
    });
    
    
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, 
        title: true, 
        price: true, 
        address: true, 
        isAvailable: true, 
        user: { select: { username: true } },
       
        rentals: { 
          where: { status: "accepted" } 
        }
      }
    });

   
    const formattedPosts = posts.map(post => ({
      ...post,
      isAvailable: post.rentals.length > 0 ? false : post.isAvailable
    }));

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" }
    });

    
    const maintenance = await prisma.maintenanceRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        post: true,
        tenant: true
      }
    });

   
    res.status(200).json({ users, posts: formattedPosts, feedbacks, maintenance });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch admin data" });
  }
};

export const createUser = async (req, res) => {
  const { username, email, password, isAdmin } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword, isAdmin: isAdmin || false },
    });
    const { password: pw, ...userInfo } = newUser;
    res.status(201).json(userInfo);
  } catch (err) {
    res.status(500).json({ message: "Failed to create user!" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const tokenUserId = req.userId;
  if (id === tokenUserId) return res.status(400).json({ message: "You cannot delete yourself!" });
  try {
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user!" });
  }
};

export const deletePost = async (req, res) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post" });
  }
};

export const deleteFeedback = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.feedback.delete({ where: { id } });
    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete feedback" });
  }
};

export const deleteMaintenance = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.maintenanceRequest.delete({ where: { id } });
    res.status(200).json({ message: "Request deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete request" });
  }
};

export const updateMaintenanceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status },
    });
    res.status(200).json(updatedRequest);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, price, address, isAvailable } = req.body;
  try {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { title, price: parseInt(price), address, isAvailable: Boolean(isAvailable) },
    });
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const toggleAdminStatus = async (req, res) => {
  const { id } = req.params;
  const tokenUserId = req.userId; 
  try {
    if (id === tokenUserId) return res.status(400).json({ message: "You cannot change your own admin status!" });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found!" });
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin: !user.isAdmin }, 
    });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Failed to update user role" });
  }
};