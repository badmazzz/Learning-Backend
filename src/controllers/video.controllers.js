import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videos.models.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comments.models.js";
import { Like } from "../models/like.models.js";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, views } = req.body;

  if (!title || !description)
    throw new ApiError(400, "Title or description required");

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) throw new ApiError(400, "Video file not found");
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail file not found");

  const uploadVideo = await uploadOnCloudinary(videoLocalPath);
  const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadVideo)
    throw new ApiError(500, "Video file failed to upload to Cloudinary");

  if (!uploadThumbnail)
    throw new ApiError(500, "Thumbnail file failed to upload to Cloudinary");

  const video = await Video.create({
    title,
    description,
    videoFile: uploadVideo.url,
    thumbnail: uploadThumbnail.url,
    owner: req.user?._id,
    duration: uploadVideo.duration,
    views
  });

  res.status(201).json(new ApiResponse(200, video, "Video published"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  res.status(200).json(new ApiResponse(200, video, "Got the video"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  if (!title || !description)
    throw new ApiError(400, "Title or description required");

  const oldVideo = await Video.findById(videoId);
  const oldThumbnail = oldVideo.thumbnail;

  const updatedThumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!updatedThumbnailLocalPath)
    throw new ApiError(400, "Did not get the thumbnail");

  let updatedThumbnailUrl;
  if (updatedThumbnailLocalPath) {
    const uploadUpdatedThumbnail = await uploadOnCloudinary(
      updatedThumbnailLocalPath
    );
    if (!uploadUpdatedThumbnail.url) {
      throw new ApiError(500, "Error while uploading new thumbnail");
    }
    updatedThumbnailUrl = uploadUpdatedThumbnail.url;
  } else {
    updatedThumbnailUrl = oldThumbnail;
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: updatedThumbnailUrl,
      },
    },
    { new: true }
  ).select("-password");

  if (oldThumbnail && updatedThumbnailLocalPath)
    await deleteFromCloudinary(oldThumbnail);

  res.status(200).json(new ApiResponse(201, video, "Thumbnail is updated"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  const comments = await Comment.find({ video: videoId });

  const commentIds = comments.map(comment => comment._id);

  await Like.deleteMany({ comment: { $in: commentIds } });

  await Comment.deleteMany({ video: videoId });

  await Playlist.updateMany(
    { videos: videoId },
    { $pull: { videos: videoId } }
  );

  await Video.deleteOne({_id: videoId});

  res
    .status(200)
    .send(new ApiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status updated successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
