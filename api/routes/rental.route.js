import express from "express";
import { 
  getRentals, 
  getRental, 
  addRental, 
  updateRentalStatus, 
  updatePaymentStatus 
} from "../controllers/rental.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getRentals);
router.get("/:id", verifyToken, getRental);
router.post("/", verifyToken, addRental);
router.put("/:id", verifyToken, updateRentalStatus);
router.put("/payment/:id", verifyToken, updatePaymentStatus);

export default router;