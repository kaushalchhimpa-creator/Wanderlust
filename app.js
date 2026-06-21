if(process.env.NODE_ENV != "production") {
    require('dotenv').config(); 
}

//console.log(process.env.SECRET); 

const express = require("express"); 
const app = express(); 
const mongoose = require("mongoose"); 
const Listing = require("./models/listing.js"); 
const path = require("path"); 
const methodOverride = require("method-override"); 
const ejsMate = require("ejs-mate"); 
//const wrapAsync = require("./utils/wrapAsync.js"); 
const ExpressError = require("./utils/ExpressError.js"); 
//const { listingSchema, reviewSchema } = require("./schema.js"); 
//const Review = require("./models/review.js"); 
const session = require('express-session');
const flash = require("connect-flash"); 
const passport = require("passport"); 
const LocalStrategy = require("passport-local"); 
const User = require("./models/user.js"); 

 

const listingsRouter = require("./routes/listing.js");  
const reviewsRouter = require("./routes/review.js"); 
const userRouter = require("./routes/user.js");  

app.set("view engine", "ejs"); 
app.set("views", path.join(__dirname, "views")); 
app.use(express.urlencoded({extended:true})); 
app.use(methodOverride("_method")); 
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public"))); 


// DATABASE CONFIGURATION: prefer cloud DB, then MONGO_URL, then local fallback
const LOCAL_MONGO = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL || process.env.MONGO_URL || LOCAL_MONGO;

// SESSION STORE CONFIGURATION
const MongoStore = require('connect-mongo').default;

const store = new MongoStore({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "mysupersecretlocalfallback",
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});


const sessionOptions = {
    store,
    secret: process.env.SECRET || "mysupersecretlocalfallback", 
    resave: false,
    saveUninitialized: true,
    cookie: {
     expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
     maxAge: 7 * 24 * 60 * 60 * 1000,
     httpOnly: true
    },
}; 


// app.get("/", (req, res) => {
//     res.send("welcome"); 
// }); 


app.use(session(sessionOptions)); 
app.use(flash());


app.use(passport.initialize()); 
app.use(passport.session()); 
passport.use(new LocalStrategy(User.authenticate()));  

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Saare routes ke upar user middleware hamesha rahega
app.use((req, res, next) => {
    res.locals.success = req.flash("success"); 
   // console.log(res.locals.success); 
   res.locals.error = req.flash("error"); 
   res.locals.currUser = req.user || null; 
    next(); 
}); 


// don't redeclare dbUrl here; already defined above

const dbSource = dbUrl.includes("@") 
  ? "Atlas (Cloud)" 
  : "Local MongoDB";
console.log(`📦 Using: ${dbSource}`);
console.log(`🔗 DB URL: ${dbUrl.substring(0, 30)}...`);

main()
.then(() => {
    console.log("✅ Connected to DB successfully"); 
})
.catch(err => {
    console.error("❌ DB Connection Error:");
    console.error(err.message || err);
    if (err.message.includes("authentication failed")) {
        console.error("\n⚠️  Check your ATLASDB_URL credentials in .env");
        console.error("   1. Verify username and password");
        console.error("   2. If password has special chars, URL-encode them: https://www.urlencoder.org/");
        console.error("   3. Check IP whitelist in Atlas Network Access");
    }
});


async function main() {
  await mongoose.connect(dbUrl);
}



 //listing.js
// const validateListing = (req, res, next) => {
//     let {error} = listingSchema.validate(req.body); 

//     if (error) {
//         let errMsg = error.details.map((el) => el.message).join(","); 
//         throw new ExpressError(400, errMsg); 
//     }
//     else {
//         next(); 
//     }
// } 



//review.js
// const validateReview = (req, res, next) => {
//     let {error} = reviewSchema.validate(req.body); 

//     if (error) {
//         let errMsg = error.details.map((el) => el.message).join(","); 
//         throw new ExpressError(400, errMsg); 
//     }
//     else {
//         next(); 
//     }
// } 


//------------------------------------//
// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     }); 

//     let registeredUser = await User.register(fakeUser, "helloworld");  //this is a password
//     res.send(registeredUser); 
// })
//--------------------------------------//


app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// root -> redirect to listings index
app.get('/', (req, res) => {
    res.redirect('/listings');
});








// app.get("/listing/find", async (req, res) => {
//       res.render("listings/find.ejs"); 
// });

app.get("/listing/find", async (req, res) => {
    try {
        let { q } = req.query; // Form se aayi hui search query
        
        let allListings = [];
        if (q) {
            // Yeh query location ya title dono mein se kisi ek mein bhi match dhoondhegi (Case-Insensitive)
            allListings = await Listing.find({
                $or: [
                    { location: { $regex: q, $options: "i" } },
                    { title: { $regex: q, $options: "i" } }
                ]
            });
        } else {
            // Agar bina kuch type kiye search kiya toh saari listings dikha dega
            allListings = await Listing.find({});
        }

        // Matched data ko find.ejs page par bhej rahe hain
        res.render("listings/find.ejs", { allListings, q });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});
 










//listing.js
//--------------------------------------------//

//    //index route
// app.get("/listings", wrapAsync(async (req, res) => {
//    const allListening = await Listing.find({})
//     // .then( res => {
//     //     console.log(res); 
//     // }); 
//    res.render("listings/index.ejs", {allListening}); 
// }));  




// //new route
// app.get("/listings/new", async (req, res) => {
//     res.render("listings/new.ejs"); 
// }); 




// //show route
// app.get("/listings/:id", wrapAsync(async (req, res) => {
//     let {id} = req.params; 
//     const listing =  await Listing.findById(id).populate("reviews"); 
//     res.render("listings/show.ejs", { listing }); 
// }));  


// //create route
// app.post("/listings",validateListing, wrapAsync( async (req, res, next) => {
 
//     // let {title, description, image, price, country, location} = req.body;
// //    if(!req.body.listing) {
// //     throw new ExpressError(400, "send valid data for listing"); 
// //    } 
  
//     // let result = listingSchema.validate(req.body);  
//     // console.log(result); 
//     // if(result.error) {
//     //     throw new ExpressError(400, result.error); 
//     // }


//    const newListing = new Listing(req.body.listing); 
    

// //    if(!newListing.title) {
// //     throw new ExpressError(400, "title is missing"); 
// //    }

// //      if(!newListing.description) {
// //     throw new ExpressError(400, "description is missing"); 
// //    }

// //      if(!newListing.location) {
// //     throw new ExpressError(400, "location is missing"); 
// //    }
//     await newListing.save();
//     res.redirect("/listings"); 
//      })
// );     



// //edit route
// app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
//     let {id} = req.params; 
//     const listing =  await Listing.findById(id); 
//     res.render("listings/edit.ejs", { listing }); 
//     //res.send("Mahadev");  
// }));       


// //update route 
// app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
// //      if(!req.body.listing) {
// //     throw new ExpressError(400, "send valid data for listing"); 
// //    }
//     let {id} = req.params; 
//     await Listing.findByIdAndUpdate(id, {...req.body.listing}); 
//     res.redirect(`/listings/${id}`);  
// }));       



//  //delete route
//  app.delete("/listings/:id",wrapAsync(async (req, res) => {
//     let {id} = req.params; 
//     await Listing.findByIdAndDelete(id); 
//     res.redirect("/listings");  
// }));        
 
//-----------------------------------------------------//

console.log(); 


//review.js
//----------------------------------------------------//
//Reviews
//Post Route
// app.post("/listings/:id/reviews", validateReview, wrapAsync( async (req, res) => {
//     let listing = await Listing.findById(req.params.id); 
//     let nleReview = new Review(req.body.review); 
//    // console.log(nleReview); 

//     listing.reviews.push(nleReview); 
//     await nleReview.save(); 
//     await listing.save(); 

//     console.log("new review saved"); 
//     //res.send("new review add");  

//     res.redirect(`/listings/${listing._id}`); 
// })
// );   



// //Delete Review Route
// app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
//     let { id, reviewId } = req.params; 

//     await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
//     await Review.findByIdAndDelete(reviewId); 

//      res.redirect(`/listings/${id}`);   
// }) ); 
//----------------------------------------------------------//
console.log(); 



//--------------------------------------------------//
// app.get("/testListing", async (req, res) => {
//  let sampleListing = new Listing({
//     title: "my nle villa",
//     description: "by the beach",
//     image: "",
//     price: 1200,
//     location: "calangute, goa",
//     country: "india" 
//  }); 

//  await sampleListing.save();   
//  console.log("sample was saved");
//  res.send("successful testing");  
// });   
//------------------------------------------------//


// app.all("*path", (req, res, next) => {
//     // next(new ExpressError()); 
//      next(new ExpressError(404, "Page Not Found"));   //ye msg nhi pass krenge to niche wala msg show krega 
// }); 




app.use((err, req, res, next) => {
    //res.send("something went wrong"); 
    let {statusCode=500, message="something went wrong!"} = err;    //ye msg tabhi show hoga jab upr se koi msg nhi aayega  => ye deafault msg h 
   // res.status(statusCode).send(message); 
   res.status(statusCode).render("error.ejs", {message}); 
}); 
 



app.listen(8080, () => {
    console.log("server is listening to port 8080"); 
});