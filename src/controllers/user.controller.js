import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 
import jwt from "jsonwebtoken"
// const registerUser = asyncHandler(async (req, res)=>{
//     res.status(200).json({
//         message:"User registered successfully"
//     }) 
// })

//putting generateAccessToken and generateRefreshToken in the a method
const generateAccessAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findOne(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

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
            $set: {
                refreshToken: undefined
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

    const incomingRefreshToken = req.cookies?.accessToken || req.body?.accessToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Invalid Refresh Token")
    }

    try {
        const decodedToken = verifyJWT(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
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
    
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("accessToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access Token Refreshed")
        )
    } catch (error) {
        throw new ApiError(401, error?.message ||  "Invalid Refresh Token")
    }

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}