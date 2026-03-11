import express from "express";
import { getAdminData, deleteUser, deletePost, createUser, updatePost } from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { toggleAdminStatus } from "../controllers/admin.controller.js";
import { deleteFeedback, deleteMaintenance , updateMaintenanceStatus} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyAdmin, getAdminData);
router.post("/user", verifyAdmin, createUser);
router.delete("/user/:id", verifyAdmin, deleteUser);
router.delete("/post/:id", verifyAdmin, deletePost);
router.put("/post/:id", verifyAdmin, updatePost);
router.patch("/user/role/:id", verifyAdmin, toggleAdminStatus);
router.delete("/feedback/:id", verifyToken, deleteFeedback);
router.delete("/maintenance/:id", verifyToken, deleteMaintenance);
router.patch("/maintenance/:id", verifyToken, updateMaintenanceStatus);
export default router;