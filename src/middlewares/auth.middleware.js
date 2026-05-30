import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import jwt from "jsonwebtoken"
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
      console.log("authmiddleare",token);
      if(!token){
          throw new ApiError(401,"Unauthorized Request")
      }
  const decodedtoken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  const logoutUser = await User.findById(decodedtoken?._id).select("-password -refreshToken")
  
  if(!logoutUser){
      // todo dis.
  throw new ApiError(401,"Invalid Access Token")
  }
  req.logoutUser = logoutUser;
  next()
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
  }

});
export {verifyJWT}