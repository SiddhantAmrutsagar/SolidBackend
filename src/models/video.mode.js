import mongoose, { Schema } from 'mongoose';
//call mongoose and extract the Schema object
import mongooseAggregatePaginate from 
'mongoose-aggregate-paginate-v2';


//create a new schema object
const videoSchema = new Schema(
    {
       videoFile:{
            type:String,//cloudinary url
            required:true,
       },
       thumbnail:{
            type:String,//cloudinary url
            required:true,
       },
       title:{
            type:String,
            required:true,
       },
       description:{
            type:String,
            required:true,
       },
       duration:{
            type:String,
            required:true,
       },
       views:{
            type:Number,
            default:0,
       },
       isPusblished:{
            type:Boolean,
            default:true,
       },
       owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
       }

    },
    {
        timestamps: true,
    }
    
)

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);