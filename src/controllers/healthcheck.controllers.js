import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  // Build a healthcheck response that simply returns the OK status as JSON with a message
  const response = new ApiResponse(200, { status: "OK" }, "Service is healthy");
  res.status(200).json(response);
});

export { healthcheck };
