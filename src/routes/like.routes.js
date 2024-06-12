import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
} from "../controllers/like.controllers.js";

const router = Router();

router.use(verifyJWT);

// http://localhost:3000/api/v1/like/...

router.route("/comment/:commentId").patch(toggleCommentLike);
router.route("/tweet/:tweetId").patch(toggleTweetLike);
router.route("/video/:videoId").patch(toggleVideoLike);
router.route("/videos").get(getLikedVideos);

export default router;
