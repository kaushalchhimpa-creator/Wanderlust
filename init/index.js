const mongoose = require("mongoose"); 
const initData = require("./data.js"); 
const Listing = require("../models/listing.js"); 


// Prefer environment DB (Atlas), then MONGO_URL, then local fallback
const LOCAL_MONGO = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL || process.env.MONGO_URL || LOCAL_MONGO;

const initDB = async () => {
        await Listing.deleteMany({});
        initData.data = initData.data.map((obj) => ({ ...obj, owner: "6a089f5566cc425ae16aa735" }));
        await Listing.insertMany(initData.data);
        console.log("data was initialized");
};

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(dbUrl);
    console.log("connected to DB");
    await initDB();
}



