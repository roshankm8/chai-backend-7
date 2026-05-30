import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userid);
    console.log("user access token", user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access Token & Refresh Token"
    );
  }
};
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
  const existinguser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existinguser", existinguser);

  if (existinguser) {
    throw new ApiError(409, "User with email or username already exist");
  }
  // const test = req;
  console.log("test", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImagelocalPath = req.files?.coverImage[0]?.path;

  let coverImagelocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalPath = req.files.coverImage[0]?.path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("avatar", avatar);

  const coverImg = await uploadOnCloudinary(coverImagelocalPath);

  console.log("coverImg url : ", coverImg?.url || "");

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

  console.log(usercreation);

  const createduser = await User.findById(usercreation._id).select(
    "-password -refreshToken"
  );
  if (!createduser) {
    throw new ApiError(500, "Something went wrong");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "User Registered Successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  // req.body -> data
  // username or email
  // find the user
  // password check
  // access & refresh token
  // send cookie
  const { email, username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username or email is requirred");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const ispasswordValid = user.isPasswordCorrect(password);
  if (!ispasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );
  // sending token in cookies
  const loggedInuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInuser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );

  // logout user
  const logoutUser = asyncHandler(async (req, res) => {});
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.logoutUser._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
    const options = {
    httpOnly: true,
    secure: true,
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged out"))

});
export { registerUser, loginUser, logoutUser };
