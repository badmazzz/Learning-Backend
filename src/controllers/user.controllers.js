import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    console.log(accessToken);
    const refreshToken = user.generateRefreshToken();
    console.log(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // user.refreshToken = refreshToken;
    // await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(401, "Token is not generated");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, email, username, password } = req.body;
  console.log("Email:- ", email);
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  )
    throw new ApiError(400, "All fields are reqired");

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser)
    throw new ApiError(409, "User with email or username exists");

  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log(avatarLocalPath);
  console.log(avatar);
  if (!avatar) throw new ApiError(400, "Avatar is required");

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    return new ApiError(500, "Something went wrong while registering user");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { username, password, email } = req.body;

  console.log(email);

  if (!username && !email)
    throw new ApiError(400, "Email or Username is reqired");

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) throw new ApiError(404, "User doesn't registerd");

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    security: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedUser, accessToken, refreshToken },
        "User loggedin Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    security: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logedout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  
  const incomingToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingToken) throw new ApiError(401, "unauthorized request");
  try {
    const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decoded) throw new ApiError(401, "Invalid refresh token");

    const user = await User.findById(decoded?._id);
    if (!user) throw new ApiError(401, "Refresh token is expired or used");

    const options = {
      httpOnly: true,
      security: true,
    };

    const { accessToken, newRefreshToken } = await generateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
