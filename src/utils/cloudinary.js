import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { response } from "express";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded on cloudinary", response.url);

    return response;
  } catch (error) {
    fs.unlink(localFilePath);
    return null;
  }
};

export {uploadOnCloudinary}