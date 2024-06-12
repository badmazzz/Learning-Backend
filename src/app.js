import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(cors());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import router

import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import videoRouter from "./routes/video.routes.js";
import likesRouter from "./routes/like.routes.js";

//Route Declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likesRouter);

export default app;
