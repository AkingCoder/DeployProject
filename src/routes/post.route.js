import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createPost, getAllPosts, getPostOfUser, getPostById, updatePost, searchPosts, deletePost } from "../controllers/post.controller.js"

const router = Router();

router
    .route("/")
    .get(getAllPosts)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "image",
                maxCount: 1
            }
        ]),
        createPost
    )

router
    .route("/search")
    .get(searchPosts)


router
    .route("/:postId")
    .get(getPostById)
    .patch(
        verifyJWT,
        upload.fields([
            {
                name: "image",
                maxCount: 1
            }
        ]),
        updatePost
    )
    .delete(verifyJWT, deletePost);

router
    .route("/user/:userId")
    .get(getPostOfUser)



export default router;
