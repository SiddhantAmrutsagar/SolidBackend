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

//routes import

import userRouter from "./routes/user.routes.js";

//routes declaration
// "/users" is the route and userRouter is the router which to be activate.
//when we type /users the control will go to userRouter router

// app.use("/users", userRouter)

// if you are defining the api are aips versioning

app.use("/api/v1/users", userRouter)


//http://localhost:8000/api/v1/users/register above url will be generated what get the route /users



//whenever asynchronous method completes, it will always return a promise
export { app }