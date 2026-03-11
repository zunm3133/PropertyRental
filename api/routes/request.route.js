import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  addRentalRequest, 
  updateRentalStatus, 
  addMaintenanceRequest, 
  updateMaintenanceStatus,
  getRentals,           
  getMaintenance       
} from "../controllers/request.controller.js";

const router = express.Router();

router.get("/rentals", verifyToken, getRentals);
router.get("/maintenance", verifyToken, getMaintenance);

router.post("/rental", verifyToken, addRentalRequest);
router.post("/maintenance", verifyToken, addMaintenanceRequest);

router.patch("/rental/:id", verifyToken, updateRentalStatus);
router.patch("/maintenance/:id", verifyToken, updateMaintenanceStatus);

export default router;