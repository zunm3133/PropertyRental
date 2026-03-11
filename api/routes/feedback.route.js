import express from "express";
import { addFeedback, getFeedbacks } from "../controllers/feedback.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; 

const router = express.Router();

router.post("/", addFeedback); 
router.get("/", verifyToken, getFeedbacks); 

export default router;