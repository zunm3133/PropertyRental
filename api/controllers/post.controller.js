import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPostCities = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      select: { city: true },
      distinct: ['city'] 
    });

    const cities = posts.map(item => item.city);
    res.status(200).json(cities);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch cities" });
  }
};

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city 
          ? {
              contains: query.city,
              mode: "insensitive",
            }
          : undefined,
          
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
      include: {
        rentals: true,
      }
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

// --- GET SINGLE POST ---
export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        rentals: true,
      },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const token = req.cookies?.token;

    if (!token) {
      return res.status(200).json({ ...post, isSaved: false, isTenant: false });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
      if (err) {
        return res.status(200).json({ ...post, isSaved: false, isTenant: false });
      }

      const saved = await prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            postId: id,
            userId: payload.id,
          },
        },
      });

      const rental = await prisma.rental.findFirst({
        where: {
          postId: id,
          tenantId: payload.id,
          status: "accepted",
        },
      });

      return res.status(200).json({ 
        ...post, 
        isSaved: saved ? true : false,
        isTenant: rental ? true : false 
      });
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body, 
        userId: tokenUserId,
      },
    });
    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const body = req.body;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...body, 
      },
    });

    res.status(200).json(updatedPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    if (!post.isAvailable) {
      return res.status(400).json({ message: "Cannot delete a property that is currently rented!" });
    }

    const relatedRentals = await prisma.rental.findMany({
      where: { postId: id },
      select: { id: true }
    });
    
    const rentalIds = relatedRentals.map(rental => rental.id);

    if (rentalIds.length > 0) {
      await prisma.payment.deleteMany({
        where: {
          rentalId: { in: rentalIds }
        }
      });
    }

    await prisma.savedPost.deleteMany({ where: { postId: id } });
    await prisma.maintenanceRequest.deleteMany({ where: { postId: id } });
    await prisma.rental.deleteMany({ where: { postId: id } });

   
    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};