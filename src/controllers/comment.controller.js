import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const addComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    console.log(postId)
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Post ID is required");
    }

    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.create({
        content,
        author: req.user._id,
        postId
    });


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment added successfully",
                comment
            )
        )

})

const deletedComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment ID is required");
    }

    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment deleted successfully",
                comment
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment ID is required");
    }

    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    );
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment updated successfully",
                comment
            )
        )
})

const getCommentsByPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Post ID is required");
    }

    const comments = await Comment.find({ postId })
    if (!comments) {
        throw new ApiError(404, "Comments not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comments fetched successfully",
                comments
            )
        )
})

export { addComment, deletedComment, updateComment, getCommentsByPost }