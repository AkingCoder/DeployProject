import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deletedComment, updateComment, getCommentsByPost } from "../controllers/comment.controller.js"

const router = Router();


router.route("/:postId").get(getCommentsByPost).post(verifyJWT, addComment)
router.route("/c/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deletedComment)

export default router;