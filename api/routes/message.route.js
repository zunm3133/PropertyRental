import express from "express";
import {
  addMessage, getFlaggedMessages, unflagMessage
} from "../controllers/message.controller.js";
import {verifyToken} from "../middleware/verifyToken.js";

const router = express.Router();


router.post("/:chatId", verifyToken, addMessage);
router.get("/flagged", verifyToken, getFlaggedMessages);
router.put("/unflag/:id", verifyToken, unflagMessage);

export default router;
