import { Router } from "express";
import {
    registerUser, logInUser, logOutUser, getUserById, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar,
} from "../controllers/user.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        }
    ]),
    registerUser
)

router.route('/login').post(logInUser)

router.route('/logout').post(verifyJWT, logOutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/change-password').post(verifyJWT, changePassword)

router.route('/current-user').get(verifyJWT, getCurrentUser)

router.route("/:userId").get(getUserById)

router.route('/update-account').patch(verifyJWT, updateAccountDetails)

router.route('/avatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar)

export default router;

