import mongoose, { Schema } from 'mongoose';

const postSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    private: { type: Boolean, default: false },
    image: { type: String },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

export const Post = mongoose.model('Post', postSchema)