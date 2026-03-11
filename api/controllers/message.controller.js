import prisma from "../lib/prisma.js";
import leoProfanity from "leo-profanity"; 

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const text = req.body.text;

  try {
    
    const user = await prisma.user.findUnique({ where: { id: tokenUserId } });
    if (user.isRestricted) {
      return res.status(403).json({ message: "You are restricted from sending messages." });
    }

    
    leoProfanity.loadDictionary('en'); 
    const isAbusive = leoProfanity.check(text); 

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    
    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        userId: tokenUserId,
        isFlagged: isAbusive, 
      },
    });

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        seenBy: [tokenUserId],
        lastMessage: text,
      },
    });

    res.status(200).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add message!" });
  }
};

// Get all messages marked as abusive
export const getFlaggedMessages = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { isFlagged: true },
      include: {
        chat: {
          select: {
            users: {
              select: { id: true, username: true, email: true, isRestricted: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    const formattedMessages = messages.map(msg => {
      const sender = msg.chat.users.find(u => u.id === msg.userId);
      return {
        ...msg,
        sender: sender || { username: "Unknown" }
      };
    });

    res.status(200).json(formattedMessages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};
export const unflagMessage = async (req, res) => {
  const messageId = req.params.id;
  try {
    await prisma.message.update({
      where: { id: messageId },
      data: { isFlagged: false } 
    });
    res.status(200).json({ message: "Message marked as safe." });
  } catch (err) {
    res.status(500).json({ message: "Failed to unflag message" });
  }
};