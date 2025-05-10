const mongoose = require("mongoose");


const otpschema = new mongoose.Schema({

    mobilenumber:{
        type:String,
    },
    email:{
        type:String,
    },
    mobileverifiedotp:{
        type:String,
    },
    emailverifiedotp:{
        type:String
    },
    otpExpiration:{
        type:Date,
        default: Date.now,
        get:(otpExpiration) => otpExpiration.getTime(),
        set:(otpExpiration) => new Date(otpExpiration)
    }
})

const otpSchema = new mongoose.model("user_otp's", otpschema);

module.exports = otpSchema;