import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    content: { type: String, required: true },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }
}, { timestamps: true });

export const Comment = mongoose.model('Comment', commentSchema);