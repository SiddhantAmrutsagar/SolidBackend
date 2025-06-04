import mongoose, {Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudinary url
            required:true,
        },
        coverImage:{
            type:String, //cloudinary url
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true, "Password is required"]
        },
        refreshToken:{
            type:String,
        }

    },
    {
        timestamps:true,
    }
)

//the pre middleware function are used to perform some operation before the document is saved to the database 
//like encrypting the password before saving it to the database
userSchema.pre("save", async function(next){
    //use to verify the password is modified if not modified then the dont change the value of the password again
    //this refers to the current user document.
    //.isModified("password") checks if the password field has been changed or newly set.
    //.isModified("fieldName") checks if a specific field (like "password") was modified/changed in the current save/update operation.
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next()
});

//custom method to generate the JWT token
//bcrypt can hash the password and also compare the password
userSchema.methods.ispasswordCorrect = async function(password)
{
    //password: entered while logging in 
    //this.password: password stored in the database
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    //jwt.sign() is a function from the jsonwebtoken library that creates a JWT token.
    return jwt.sign(
        //payload
        {
            _id: this._id,
            email: this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        //payload
        {
            _id: this._id,
        
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User  = mongoose.model("User", userSchema);