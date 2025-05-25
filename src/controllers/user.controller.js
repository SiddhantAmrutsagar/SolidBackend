import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 

// const registerUser = asyncHandler(async (req, res)=>{
//     res.status(200).json({
//         message:"User registered successfully"
//     }) 
// })



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

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(400, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, "User registered Successfully", createdUser)
    )
    


})
export {registerUser,}