import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.models.js";
import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user?._id;
  if (userId) {
    throw new ApiError(404, "userID is missing");
  }

  const videos = await Video.aggregate([
    {
      $match: new mongoose.Types.ObjectId(userId),
    },
    {
      $sort
    }
  ]);
});

export { getChannelStats, getChannelVideos };
