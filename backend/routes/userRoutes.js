// routes/userRoutes.js
// Routing interaksi sosial user (follow & status).

import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import { userController } from "../controllers/userController.js";

const router = express.Router();
router.use(verifyToken);

router.post("/:id/follow", userController.toggleFollow);
router.get("/:id/follow-status", userController.getFollowStatus);

export default router;
