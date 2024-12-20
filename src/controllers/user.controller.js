import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { v2 as cloudinary } from "cloudinary"
import jwt from "jsonwebtoken"
import { isValidObjectId } from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        // console.log(accessToken)
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Error generating access token and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (
        [email, username, password].some((feilds) => {
            feilds?.trim() == ""
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req?.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar feild required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(500, "Error uploading avatar to cloudinary")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
    })

    const checkUser = await User.findById(user._id)
    if (!checkUser) {
        throw new ApiError(500, "Error creating user")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(checkUser._id)
    if (!accessToken || !refreshToken) {
        throw new ApiError(500, "Error generating and refresh tokens")
    }


    const options = {
        httpOnly: true,
        secure: false,
    }



    return res
        .status(201)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                "User registered",
                checkUser
            )
        )
})

const logInUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        throw new ApiError(401, "Username and password are required")
    }

    const user = await User.findOne({ username: username })
    if (!user) {
        throw new ApiError(404, "Invalid credentials")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    if (!accessToken || !refreshToken) {
        throw new ApiError(500, "Error generating and refresh tokens")
    }

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: false,
        sameSite: "None",
    }

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                "User Logged in Successfully",
                loggedInUser
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    let options = {
        httpOnly: true,
        secure: false
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                "User Logged out Successfully",
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized")
    }
    try {

        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if (!decodedRefreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const user = await User.findById(decodedRefreshToken._id)
        if (!user) {
            throw new ApiError(401, "Unauthorized")
        }
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    "User refreshed successfully",
                    { accessToken, refreshToken: newRefreshToken }
                )
            )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required")
    }
    const user = await User.findById(req.user._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid current password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Password changed successfully",
            )
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User fetched successfully",
                user
            )
        )

})

const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User ID is required")
    }
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User fetched successfully",
                user
            )
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, username } = req.body
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                email: email || user.email,
                username: username.toLowerCase() || user.username
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User details updated successfully",
                user
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Something went wrong uploading avatar")
    }
    // how to delete the avatar on cloudinary
    const deleteAvatar = await User.findById(req.user._id)
    const extractPublicId_1 = deleteAvatar.avatar.split("/")
    const extractPublicId_2 = extractPublicId_1[extractPublicId_1.length - 1].split(".")[0]
    await cloudinary.uploader.destroy(extractPublicId_2)

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User avatar updated successfully",
                user
            )
        )
})

export {
    registerUser,
    logInUser,
    logOutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    getUserById,
    updateAccountDetails,
    updateUserAvatar,
}
