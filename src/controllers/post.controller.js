import { Post } from "../models/post.model.js";
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { isValidObjectId } from "mongoose";

const createPost = asyncHandler(async (req, res) => {
    const { title, content, private: privateMode } = req.body
    if (title.trim() == '' || content.trim() == '') {
        throw new ApiError(400, 'Title and content are required')
    }

    const postPictureLocalPath = req?.files?.image[0]?.path;
    console.log(postPictureLocalPath)

    const postPicture = await uploadOnCloudinary(postPictureLocalPath)
    if (!postPicture) {
        throw new ApiError(500, 'Error uploading post picture to cloudinary')
    }

    const post = await Post.create({
        title,
        content,
        image: postPicture.url || '',
        private: privateMode || false,
        author: req.user._id
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                'Post created successfully',
                post
            )
        )

})

const getAllPosts = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10;  // Default to 10 posts per page

        console.log(page)
        const skip = (page - 1) * limit;

        // Find posts with pagination and populate author
        const posts = await Post.find({ private: false })
            .populate('author', 'username avatar',)
            .skip(skip)
            .limit(limit);

        // console.log(posts)

        // Get total number of posts to calculate total pages
        const totalPosts = await Post.countDocuments({
            private: false
        });
        const totalPages = Math.ceil(totalPosts / limit);

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    'Posts fetched successfully',
                    {
                        page,
                        totalPages,
                        totalPosts,
                        posts
                    }
                )
            );
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }

})

const searchPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { query } = req.query;

    if (page < 1 || limit < 1) {
        return res.status(400).json(
            new ApiResponse(400, 'Invalid pagination parameters', {})
        );
    }

    try {
        const searchCriteria = query && { title: { $regex: query, $options: 'i' }, private: false }

        const posts = await Post.find(searchCriteria)
            .populate('author', 'username avatar')
            .skip(skip)
            .limit(limit);

        const totalPosts = await Post.countDocuments(searchCriteria);
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json(
            new ApiResponse(200, 'Posts fetched successfully', {
                page,
                totalPages,
                totalPosts,
                posts,
            })
        );
    } catch (error) {
        res.status(500).json(
            new ApiResponse(500, 'Server error', { error: error.message })
        );
    }
});

const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, 'Post ID is required')
    }

    const post = await Post.findById(postId)
    if (!post) {
        throw new ApiError(404, 'Post not found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Post fetched successfully',
                post
            )
        );
})

const getPostOfUser = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, 'User ID is required')
    }

    try {
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10;  // Default to 10 posts per page

        const skip = (page - 1) * limit;

        // Find posts with pagination and populate author
        const posts = await Post.find({
            author: userId
        })
            .populate('author', 'username avatar',)
            .skip(skip)
            .limit(limit);

        console.log(posts)

        // Get total number of posts to calculate total pages

        const totalPosts = posts.length;
        const totalPublished = posts.filter((post) => { return post.private == false; }).length;
        const totalPrivate = posts.filter((post) => { return post.private == true; }).length;

        const totalPages = Math.ceil(totalPosts / limit);

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    'Posts fetched successfully',
                    {
                        page,
                        totalPages,
                        totalPosts,
                        totalPublished,
                        totalPrivate,
                        posts
                    }
                )
            );
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }


})

const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, 'updatePost Invalid Post ID');
    }

    let postPicture;
    if (req?.files?.image?.length > 0) {
        const postPictureLocalPath = req?.files?.image[0]?.path;
        postPicture = await uploadOnCloudinary(postPictureLocalPath);
        if (!postPicture) {
            throw new ApiError(500, 'Error uploading post picture to Cloudinary');
        }
    }

    const updateData = {
        title: req?.body?.title,
        content: req?.body?.content,
        image: postPicture?.url || req?.body?.image,
        private: req?.body?.private,
    };

    // Check for empty fields
    if (!updateData.title || !updateData.content) {
        throw new ApiError(400, 'Title and content are required');
    }

    const post = await Post.findByIdAndUpdate(postId, { $set: updateData }, { new: true, runValidators: true });

    if (!post) {
        throw new ApiError(404, 'Post not found');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Post updated successfully',
                post
            )
        );
});

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, 'Post ID is required')
    }

    const post = await Post.findByIdAndDelete(postId)
    if (!post) {
        throw new ApiError(404, 'Post not found')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                'Post deleted successfully',
                post
            )
        )
})



export { createPost, getAllPosts, getPostById, getPostOfUser, updatePost, deletePost, searchPosts }