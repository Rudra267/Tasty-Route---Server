require("dotenv").config();
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const keysecret = process.env.SECRET_KEY


const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        trim: true
    },
    // googleId:{
    //     type:String,
    //     unique:true,
    // },
    image:[
        { url: String,
         public_id: String }
    ],
    email:{
        type: String,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("not valid email")
            }
        }
    },
    emailChecked:{
        type:String,
        default: 'not verified'
    },

    google_ac_image:{
        type: String,
    },
    mobilenumber: {
        type: String,
    },
    mobilenumberChecked:{
        type:String,
        default: 'not verified'
    },
    password: {
        type: String,
        minlength: 6
    },
    tokens: [
        {
            token: {
                type: String
            }
        }
    ]
},{timestamps:true});



// hash password

userSchema.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next()
});


// token generate
userSchema.methods.generateAuthtoken = async function () {
    try {
        let token23 = jwt.sign({ _id: this._id }, keysecret, {
            expiresIn: "1d"
        });

        this.tokens = this.tokens.concat({ token: token23 });
        await this.save();
        return token23;
    } catch (error) {
        console.log('error token generate');
    }
}


// createing model
const userdb = new mongoose.model("users", userSchema);

module.exports = userdb;


// if (this.isModified("password")) {    }