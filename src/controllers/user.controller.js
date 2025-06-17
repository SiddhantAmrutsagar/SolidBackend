import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
// const registerUser = asyncHandler(async (req, res)=>{
//     res.status(200).json({
//         message:"User registered successfully"
//     }) 
// })

//this function is not a route handler, it is a utility function(helping functn)
//It doesn't handle HTTP requests/responses directly.
//putting generateAccessToken and generateRefreshToken in the a method
const generateAccessAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        
        console.log("generateAccessAndRefreshToken user: ", user);

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
    }
}

const registerUser = asyncHandler(async (req, res)=>{
    //get user details from frontend
    //validation - not empty
    //check if user already exits: username, email
    //check for image check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation 
    //return res
    const {fullName, email, username, password} =req.body
    console.log("email:", email);
    
    //if any of the fields from the form after trimming the spaces from both the ends is null of empty or just "" and return true the throw the error
    if([fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError( 400, "All fields are required")
    }

    const existedUser = await User.findOne({
        //operator "or" to check if the username or email already exists
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(400, "User with username or email already exists")
    }

    //req.fields is used to get the fields from the form data
    //? prevent the app from crashing if the fields are not present. it will return undefined.
    
    // After upload, Multer stores file details in req.files
    const avatarLocalPath =req.files?.avatar[0]?.path;                     
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; 
    
    //if coverImage is not present then it will be null
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path
    }
 
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is requird")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is requird")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    //upto this step user is created in database

    //now we send the details to user that they are resistered.
    //remove the password and refreshtoken for response to user
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // refreshToken is empty here

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, "User registered Successfully", createdUser)
    )
    
    
    
})//user is created in db

//login user
const loginUser = asyncHandler(async (req, res)=>{
    //req -> body
    //username or email
    //find user
    //password check
    //generate access token and refresh token
    //send cookies

    //retrive user data using form data 
    const {email, username, password} = req.body
    console.log("email:", email);
    
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    //what all will do is it look for both username and email. If any of them matches, it will return the user
    //if both are present then it will return the user with the username
    const user= await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found ")
    }

    const ispasswordValid = await user.ispasswordCorrect(password)

     if(!ispasswordValid){
        throw new ApiError(401, "Invalid user Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    // user object the refreshToken is empty
    //set the refresh token in the user document
    // user.refreshToken = refreshToken
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    //or 

    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in Successfully"
        )
    )
    
})

//how to logout user
//find user using user_id
//*NO form data is avail to find user*
//verify access token using jwt
//remove their cookies
//reset access token

const logoutUser = asyncHandler(async (req, res)=>{
    //find user by id and update refreshToken to undefined and response the new value(undefined)
    console.log("middleware logoutUser called");
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new:true
        }
    )

    //now refreshToken is update from database
    //now cookies are to be cleared

    const options ={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User is Successfully Logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res)=>{

    console.log("/n refreshAccessToken route is running");
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    console.log("cookies token: ", req.cookies); 
    console.log("/n incomingRefreshToken: ", incomingRefreshToken);
    
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Refresh Token")
    }

    try {
        console.log("process.env.REFRESH_TOKEN_SECRET: ", process.env.REFRESH_TOKEN_SECRET);

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        console.log("decodedToken: ", decodedToken);

        const user = await User.findById(decodedToken?._id)
        console.log("user refresh token: ", user?.refreshToken);

        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        console.log("regenerated access tokens: ", accessToken );
        console.log("regenerated refresh tokens: ", newRefreshToken );
        
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed")
        )
    } catch (error) {
        throw new ApiError(401, error?.message ||  "Invalid Refresh Token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) =>{
    const {oldPassword, newPassword} = req.body
    //const confirmPassword = req.body.confirmPassword
    //if(!(newPassword === confirmPassword)){
    // throw new ApiError()
    // }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.ispasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password, try correct password")
    }

    user.password = newPassword

    await user.save({validateBeforeSava: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req, res)=>{
    return res
    .status(200)
    .json( new ApiResponse(200, req.user, "Current User fetched Successfully"))
})

const updateAccountDetails = asyncHandler( async (req, res)=>{
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
        {
            $set:{
                fullName,
                email
            }
        },
        // By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
        {new: true}
    )

    return res
    .status(200)
    .json( new ApiResponse(200, user, "User details is updated Successfully"))

})

const updateUserAvatar = asyncHandler( async (req, res)=>{
   const avatarLocalPath =  req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }
    },
    {new: true}
   ).select("-password")

   return res
   .status(200)
   .json( new ApiResponse(200, user, "User avatar is updated Successfully"))
})

const updateUserCoverImage = asyncHandler( async (req, res)=>{
   const coverImageLocalPath =  req.file?.path

   if(!coverImageLocalPath){
    throw new ApiError(400, "coverImage is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage: coverImage.url
        }
    },
    {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "User coverImage updated Successfully"))
})

const getUserChannelProfile = asyncHandler( async (req, res) => {
    //when you want to get the user data we will get it from the url of the user using req.params
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    //aggregate is a method that take array
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
            //now I filtered one doc from database
        },
        {
            //this is to get the no of subscriber to the channel (followers)
            $lookup:{
                from: "subscriptions",   //target collection
                localField: "_id",       //user._id
                foreignField: "channel", //
                as: "subscribers"
            },
            //this is to get the no channels user is subscribed to (following)
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscridedTo"
            }, 
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "subscribedTo"
                },
                //this is to know the channel is subscribed or not
                //find if the req.user is present in object subscribers.subscriber in the model
                //$in: means present or not in object
                isSubscribed:{
                    $cond: {
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            //project will project the fields we want to return which are demanded
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar:1,
                coverImage: 1,
                email:1,

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel is fetched successfully")
    )
})

const getWatchHistory = asyncHandler( async (req, res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        }, 
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "user",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            //sub-pipeline
                            pipeline: [
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                 $first: "$owner"
                            }
                        }
                    }
                ]

            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

                                                                                                                                                                                                                                                                                                                                               

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}