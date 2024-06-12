import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.models.js";
import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { users } from "moongose/models/index.js";
import { Like } from "../models/like.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page,
    limit,
  };

  const allComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId("6665ad23244153f3980f3318"),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    }, {
      $addFields: {
        likes:{$size:"$likes"}
      }
    }
  ]);

  /*const allComment = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    // sort by date
    {
      $sort: {
        createdAt: -1,
      },
    },
    // get comments all likes and dislikes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    // fetch owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
    // logic to derive fields from like array
    {
      $addFields: {
        likesCount: {
          $size: {
            $filter: {
              input: "$likes",
              as: "like",
              cond: { $eq: ["$$like.liked", true] },
            },
          },
        },
        disLikesCount: {
          $size: {
            $filter: {
              input: "$likes",
              as: "like",
              cond: {
                $eq: ["$$like.liked", false],
              },
            },
          },
        },
        isLiked: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$likes",
                      as: "like",
                      cond: {
                        $and: [
                          {
                            $eq: ["$$like.likedBy", req.user?._id],
                          },
                          {
                            $eq: ["$$like.liked", true],
                          },
                        ],
                      },
                    },
                  },
                },
                0,
              ],
            },
            then: true,
            else: false,
          },
        },
        isDisLiked: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$likes",
                      as: "like",
                      cond: {
                        $and: [
                          {
                            $eq: ["$$like.likedBy", req.user?._id],
                          },
                          {
                            $eq: ["$$like.liked", false],
                          },
                        ],
                      },
                    },
                  },
                },
                0,
              ],
            },
            then: true,
            else: false,
          },
        },
        isLikedByVideoOwner: {
          $cond: {
            if: {
              $in: [Video.owner, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
        isOwner: {
          $eq: [req.user?._id, "$owner._id"],
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        isLiked: 1,
        likesCount: 1,
        isLikedByVideoOwner: 1,
        isOwner: 1,
        isDisLiked: 1,
        disLikesCount: 1,
      },
    },
  ]);*/

  return res
    .status(200)
    .json(new ApiResponse(200, allComments, "All comments Sent"));
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
