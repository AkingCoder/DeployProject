import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // console.log(req.cookies)
        const token = req.cookies?.accessToken
        console.log(token)
        if (!token) {
            throw new ApiError(401, 'Unauthorized');
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoded?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, 'User not found');
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Access Token");
    }

})