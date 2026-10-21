// routes/userRoutes.js
// Routing interaksi sosial user (follow & status).

import express from "express";
import verifyToken, { optionalToken } from "../middleware/authMiddleware.js";
import { userController } from "../controllers/userController.js";

const router = express.Router();

router.get("/dashboard", verifyToken, userController.getDashboard);
router.post("/:id/follow", verifyToken, userController.toggleFollow);
router.get("/:id/follow-status", verifyToken, userController.getFollowStatus);
router.get("/:id", optionalToken, userController.getPublicProfile);

export default router;
