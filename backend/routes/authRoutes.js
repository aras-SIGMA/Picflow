// routes/authRoutes.js
// Routing autentikasi dan profil user.

import express from "express";
import verifyToken from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { authController } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.put(
  "/profile-picture",
  verifyToken,
  upload.single("image"),
  authController.updateProfilePicture
);
router.get("/me", verifyToken, authController.getMe);

export default router;
