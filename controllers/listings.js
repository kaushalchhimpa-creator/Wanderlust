const Listing = require("../models/listing"); 

module.exports.index = async (req, res) => {
   const allListening = await Listing.find({})
    // .then( res => {
    //     console.log(res); 
    // }); 
   res.render("listings/index.ejs", {allListening}); 
}; 


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs"); 
}; 




module.exports.showListing = async (req, res) => {
    let {id} = req.params; 
    const listing =  await Listing.findById(id).populate({path: "reviews", populate: {path: "author"},}).populate("owner"); 
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");  
        return res.redirect("/listings"); 
    }
    console.log(listing); 
    res.render("listings/show.ejs", { listing }); 
};  




module.exports.createListing = async (req, res, next) => {
    if (!req.file) {
      req.flash("error", "Please upload a listing image.");
      return res.redirect("/listings/new");
    }

    const userLocation = req.body.listing.location;
    let geometry = { type: "Point", coordinates: [0, 0] };

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userLocation)}&limit=1`, {
        headers: { "User-Agent": "WanderLust/1.0" },
      });
      const geoData = await geoRes.json();

      if (geoData.length > 0) {
        geometry = {
          type: "Point",
          coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)],
        };
      }
    } catch (err) {
      console.log("Geocoding failed, saving listing with default coordinates:", err.message);
    }

    let url = req.file.path; 
    let filename = req.file.filename; 
   // console.log(url, "..", filename); 

   const newListing = new Listing(req.body.listing); 
  // console.log(req.user); 

   newListing.geometry = geometry;

   newListing.owner = req.user._id; 
   newListing.image = {url, filename};  

   let savedListing = await newListing.save();
   console.log(savedListing); 
   req.flash("success", "new Listing Created!"); 
   res.redirect("/listings"); 
};  



module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params; 
    const listing =  await Listing.findById(id); 
     if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");  
        return res.redirect("/listings"); 
    }
    let originalImageUrl = listing.image?.url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60";
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_180,w_260,c_fill"); 

    res.render("listings/edit.ejs", { listing, originalImageUrl }); 
};  



module.exports.updateListing = async (req, res) => {
    let {id} = req.params; 
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing}, {new: true, runValidators: true}); 

    if(!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    if(typeof req.file !== "undefined") {
    let url = req.file.path; 
    let filename = req.file.filename; 
    listing.image = { url, filename}; 
    await listing.save(); 
    }

    req.flash("success", "Listing Updated!"); 
    res.redirect(`/listings/${id}`);  
}; 



module.exports.destroyListing = async (req, res) => {
    let {id} = req.params; 
    await Listing.findByIdAndDelete(id); 
    req.flash("success", "Listing Deleted");  
    res.redirect("/listings");  
}; 



