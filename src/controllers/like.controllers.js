import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/videos.models.js";
import { Comment } from "../models/comments.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  let isLiked = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });
  if (isLiked) {
    const like = await Like.findByIdAndDelete(isLiked._id);
    if (!like) throw new ApiError(500, "error while toggling like");
    isLiked = false;
  } else {
    const like = await Like.create({ video: videoId, likedBy: userId });
    if (!like) throw new ApiError(500, "error while toggling like");
    isLiked = true;
  }

  res.status(200).json(new ApiResponse(200, isLiked, "Like toggeled"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid comment ID");

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  let isLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (isLiked) {
    const like = await Like.findByIdAndDelete(isLiked?._id);
    if (!like) throw new ApiError(500, "error while toggling like");
    isLiked = false;
  } else {
    const like = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });
    if (!like) throw new ApiError(500, "error while toggling like");
    isLiked = true;
  }

  res.status(200).json(new ApiResponse(200, isLiked, "Like toggeled"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;
  if (!userId) throw new ApiError(404, "User not found");

  const likedVideos = await Like.aggregate([
    {
      $match: {
        video: { $ne: null },
        likedBy: new mongoose.Types.ObjectId("666533b250be07a5ff1f0b96"),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $project: {
              title: 1,
              description: 1,
              views: 1,
              duration: 1,
              videoFile: 1,
              thumbnail: 1,
              isPublished:1
            },
          },
        ],
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $match: {
        "likedVideos.isPublished": true,
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
