import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(hashedPassword);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    console.log(newUser);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create user!" });
  }
};
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, 10);

   
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hash,
        resetTokenExpiry: new Date(Date.now() + 3600000), 
      },
    });

   
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user.id}`;

    const mailOptions = {
      from: "PRMS Support <support@prms.com>",
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};


export const resetPassword = async (req, res) => {
  const { userId, token, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (new Date() > user.resetTokenExpiry) {
        return res.status(400).json({ message: "Token has expired" });
    }

    
    const isValid = await bcrypt.compare(token, user.resetToken);
    if (!isValid) return res.status(400).json({ message: "Invalid token" });

   
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
   
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid Credentials!" });

    
    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
        
        isAdmin: user.isAdmin, 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    
    const { password: userPassword, ...userInfo } = user;

    
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: age,
      })
      .status(200)
      .json(userInfo); 
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  }).status(200).json({ message: "Logout Successful" });
};
