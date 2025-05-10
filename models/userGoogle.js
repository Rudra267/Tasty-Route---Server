const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    googleId:String,
    displayName:String,
    email:String,
    google_ac_image:String,
},{timestamps:true});

const userGoogleSchema = new mongoose.model("GoogleAuthUsers",userSchema);

module.exports = userGoogleSchema;