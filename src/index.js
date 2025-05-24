import express from "express";
// require("dotenv").config({path: "./.env"});
import dotenv from "dotenv";

// import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import {app} from "./app.js";

// const app = express();

dotenv.config({
    path: "./.env"
});

connectDB()
.then(() => {
    app.on("error", (error)=>{
        console.log("ERROR:", error);
        throw error;
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port: ${process.env.PORT}`);
    })}
)
.catch((err)=>{
    console.log("MongoDB connection FAILED :", err);
})







/*

( async () =>{
    try {
        mongoose.connect(`${process.env.
            MONGODB_URI}/${DB_NAME}`)
            app.on("error", (error) => {
                console.log("MongoDB connection error:", error);
                throw error;
            });

            app.listen(process.env.PORT, () => {
                console.log(`Server is running on port $
                {process.env.PORT}`);
                
            })
        
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
        
    }
})()

*/