import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  console.log("registerUser", registerUser);

  // res.status(200).json({
  //   message: "ok chai or code",
  // });
  // step 1 get user details from frontend
  // step 2  validation in email - not empty
  // step 3 check if user already exist: username,email
  // step 4 check for images , check for avatar
  // step 5 upload images to cloudinary: avatar
  // step 6 create user object to sen din mongo db because it is assumed to send object - create entry in db
  // step 7 REMOVE password and refresh token field from response
  // step 8 chck for user creation
  // step 9 if user creation return response else return error

  const { fullname, email, username, password } = req.body;
  console.log("body", req.body);
  if ([fullname, email, username, password].some((i) => i?.trim()) === "") {
    throw new ApiError(400, "All fields are required");
  }
  const existinguser = User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existinguser", existinguser);

  if (existinguser) {
    throw new ApiError(409, "User with email or username already exist");
  }
  const test = req;
  console.log("test", test);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImagelocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("avatar", avatar);

  const coverImg = await uploadOnCloudinary(coverImagelocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  const usercreation = await User.create({
    fullname,
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createduser = User.findById(usercreation._id).select(
    "-password -refreshToken"
  );
});
if (!createduser) {
  throw new ApiError(500, "Something went wrong");
}
return res
  .status(201)
  .json(new ApiResponse(200, createduser, "User Registered Successfully"));

export { registerUser };
