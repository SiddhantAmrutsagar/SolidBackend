import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//use method is used to configuration and middleware
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }
));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true, limit:"16kb"}));
app.use(express.static("public"))
app.use(cookieParser())





//whenever asynchronous method completes, it will always return a promise
export { app }