import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"


//middleware is created logout functionality is required in many other functionalities like adding a post, liking the post which required the valid the user

export const verifyJWT = asyncHandler(async (req, _, next) =>{
    //res is not in use so ("_")
    try {
        console.log(req.cookies);
        
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")  
        console.log("token:",token);
        
         
        if(!token){ 
            throw new ApiError(401, "Unauthorized request")
        }
    
        //if token is present then verify the token
        //jwt.verify() is used to verify the token and decode it
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        //we will receive data(payload) which is encoded in the token
    
        
    
        //if token is verified, then find the user using the decodedtoken _id(this is how it is written in payload)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        //user data is returned without password and refreshToken
    
        if(!user){
            throw new ApiError(401, "Invalild access token")
        }
    
        req.user = user;
        //attach the user to the request object so that it can be accessed in the next middleware or route handler
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }

})