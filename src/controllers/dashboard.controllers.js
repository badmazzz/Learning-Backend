import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.models.js";
import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { users } from "moongose/models/index.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userID = req.user?._id;
    if (!userID) {
        throw new ApiError(404,"userID is missing")
    }
    const videos = Video.find({ owner: userID });
    if (!videos) throw new ApiError(404, "There is no videos");
    
    res.status(200).json(new ApiResponse(200,videos,"Videos fetched successfully"))
});

export { getChannelStats, getChannelVideos };
