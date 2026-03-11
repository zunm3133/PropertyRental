import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const verifyAdmin = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "Not Authenticated!" });

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    if (err) return res.status(403).json({ message: "Token is not Valid!" });

    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Not authorized! Admin access only." });
    }

    req.userId = payload.id;
    next();
  });
};