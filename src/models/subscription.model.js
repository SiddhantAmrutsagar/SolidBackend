import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber:{
            type: Schema.Types.ObjectId,//one who is subscripting
            ref: "User"
        },
        channel:{
            type: Schema.Types.ObjectId,// one to whom 'subscriber' is subscribing
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)


//1) export const Subscription = mongoose.model("nameofmodel", subscriptionSchema);
//2) actual MongoDB collection will be called: subscriptions.
    // A collection holds multiple documents, but in JSON format
//3)This is the structure for the documents that will go into the "subscriptions" collection
    // What fields each document will have
    // What types they are
    // If they are required
    // If they reference other collections (like User)
    // Whether timestamps are automatically managed
//4) export const Subscription = ...
    //Assign it the model created by mongoose.model()
    
        // Mongoose model connects to the MongoDB collection
        // Mongoose looks for or creates a collection called users
        // You run User.create({...})	Inserts a new document in the users collection
        // You run User.find()	Queries documents from the users collection
        // You run User.updateOne()	Updates a document in the users collection

export const Subscription = mongoose.model("Subscription", subscriptionSchema);