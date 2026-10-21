// routes/categoryRoutes.js
// Routing endpoint categories.

import express from "express";
import verifyToken, { verifyAdmin } from "../middleware/authMiddleware.js";
import { categoryController } from "../controllers/categoryController.js";

const router = express.Router();
const adminOnly = [verifyToken, verifyAdmin];

router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);
router.post("/", adminOnly, categoryController.create);
router.put("/:id", adminOnly, categoryController.update);
router.delete("/:id", adminOnly, categoryController.delete);

export default router;
