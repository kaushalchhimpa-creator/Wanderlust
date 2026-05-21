const mongoose = require("mongoose"); 
const Schema = mongoose.Schema; 
const Review = require("./review.js");


const listingSchema = new Schema({
    title: {
      type: String,
      required: true,
    },
    description: String,
    image: {
         filename: String,
         url: String,
       // default: "https://unsplash.com/photos/use-the-summer-day-child-in-the-pool-PFrK4n6l-4Y",
       // set: (v) => v === "" ? "https://unsplash.com/photos/use-the-summer-day-child-in-the-pool-PFrK4n6l-4Y" : v,
    },
    price: Number, 
    location: { 
      type: String,
    },
    country:  {  
      type: String,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    geometry: {
    type: {
        type: String, // 'location.type' must be 'String'
        enum: ["Point"], // 'location.type' must be 'Point'
        required: true
    },
    coordinates: {
        type: [Number], // Array of numbers: [longitude, latitude]
        required: true
    }
}, 
});   

listingSchema.post("findOneAndDelete", async (listing) => {
 if(listing) {
   await Review.deleteMany({_id: {$in: listing.reviews}}); 
 }
}) 

const Listing = mongoose.model("Listing", listingSchema); 
module.exports = Listing;  
