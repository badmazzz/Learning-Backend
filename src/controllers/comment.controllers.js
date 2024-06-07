import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.models.js";
import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { users } from "moongose/models/index.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) throw new ApiError(400, "Write a comment");
  if (!videoId) throw new ApiError(400, "Video ID is required");

  // Verify that the video exists
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const comment = await Comment.create({
    content,
    owner: req.user?._id,
    video: videoId,
  });

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentID } = req.params;

  const { content } = req.body;
  if (!content)
    throw new ApiError(400, "Content is required to update comment");

  if (!isValidObjectId(commentID))
    throw new ApiError(400, "Invalid comment ID");

  const comment = Comment.findById(commentID);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.owner.toString() !== req.user?._id.toString())
    throw new ApiError(403, "You are not authorized to update this comment");

  comment.content = content;
  await comment.save();

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentID } = req.params;

  if (!isValidObjectId(commentID))
    throw new ApiError(400, "Invalid comment ID");

  const comment = Comment.findById(commentID);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (comment.owner.toString() !== req.user?._id.toString())
    throw new ApiError(403, "You are not authorized to update this comment");

  await comment.remove();

  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));

});

export { getVideoComments, addComment, updateComment, deleteComment };
