import dotenv from "dotenv";
dotenv.config({ 
    path: './.env'
});
// import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import {app} from "./app.js";
// const app = express();



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