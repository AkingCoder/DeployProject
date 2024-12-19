import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ limit: '10mb', extended: true }));


app.use(express.static("public"))

app.use(cookieParser());

import userRouter from './routes/user.route.js';
import postRouter from './routes/post.route.js';
import commentRouter from "./routes/comment.route.js"

app.use('/api/v1/user', userRouter);
app.use('/api/v1/post', postRouter);
app.use('/api/v1/comment', commentRouter);


export default app