// routes/photoRoutes.js
// Routing karya fotografi, suka (like), diskusi (comments), dan telaah (critiques).

import express from "express";
import verifyToken, { optionalToken } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { photoController } from "../controllers/photoController.js";
import { commentController } from "../controllers/commentController.js";
import { critiqueController } from "../controllers/critiqueController.js";

const router = express.Router();

// ====== FOTO CRUD ======
router.post(
  "/",
  verifyToken,
  upload.single("image"),
  photoController.createPhoto
);
router.get("/", optionalToken, photoController.getFeed);
router.get("/:id", optionalToken, photoController.getDetail);
router.put(
  "/:id",
  verifyToken,
  upload.single("image"),
  photoController.updatePhoto
);
router.delete("/:id", verifyToken, photoController.deletePhoto);

// ====== SUKA (LIKES) ======
router.post("/:id/like", verifyToken, photoController.toggleLike);

// ====== DISKUSI (COMMENTS) ======
router.get("/:id/comments", optionalToken, commentController.getComments);
router.post("/:id/comments", verifyToken, commentController.addComment);
router.delete(
  "/:id/comments/:commentId",
  verifyToken,
  commentController.deleteComment
);

// ====== TELAAH 4 PILAR (CRITIQUES) ======
router.get("/:id/critiques", optionalToken, critiqueController.getCritiques);
router.post("/:id/critiques", verifyToken, critiqueController.createCritique);
router.put(
  "/:id/critiques/:critiqueId",
  verifyToken,
  critiqueController.updateCritique
);
router.delete(
  "/:id/critiques/:critiqueId",
  verifyToken,
  critiqueController.deleteCritique
);

export default router;
