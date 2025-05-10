require("dotenv").config();
const express = require("express");
const app = express();
require("./db/conn");
const router = require("./routes/router");
const cors = require("cors");
const cookiParser = require("cookie-parser")
const port = 8009;
const bodyparser = require("body-parser")
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userbyGoogle = require("./models/userGoogle")
const userdb = require("./models/userSchema")
const clientid = process.env.GOOGLE_CLIENT_ID
const clientsecret = process.env.GOOGLE_SECRECT_CLIENT
// const FacebookStrategy = require("passport-facebook").Strategy;
// const userbyFacebook  = require("./models/facebookDatabase");
// const config = require("./config/config")

// const jwt = require("jsonwebtoken")
// const keysecret = process.env.SECRET_KEY


// app.get("/",(req,res)=>{
//     res.status(201).json("server created")
// });

app.use(express.json());
app.use(cookiParser());
app.use(bodyparser.json());
app.use(cors());
app.use(router);



app.use(session({
    secret:"YOUR SECRET KEY",
    resave:false,
    saveUninitialized:true
}))

// setuppassportfor GoogleAuth
app.use(passport.initialize());
app.use(passport.session());
//google

app.get('/', (req, res) => {
    res.send('Hello from Express on Vercel!');
  });
passport.use(
    new OAuth2Strategy({
        clientID:clientid,
        clientSecret:clientsecret,
        callbackURL:"/auth/google/callback",
        scope:["profile","email"]
    },
    async(accessToken,refreshToken,profile,done)=>{
        try {
            let user = await userbyGoogle.findOne({ googleId: profile.id });
            console.log(profile.emails[0].value)

            if (!user) {
                // If the user doesn't exist, create a new user with Google data
                user = new userbyGoogle({
                    googleId: profile.id,
                    fullname: profile.displayName,
                    email: profile.emails[0].value,
                    google_ac_image:profile.photos[0].value
                                        
                });

                await user.save();
            }
        
            // Save the user to the database
            

            const ValidUserOne = await userdb.findOne({ email:  profile.emails[0].value});
            if(!ValidUserOne){

                const finalUser = new userdb({
                    googleId: profile.id,
                    facebookId:" ",
                    fullname: profile.displayName,
                    email: profile.emails[0].value,
                    google_ac_image: profile.photos[0].value
                });

                await finalUser.save();
                console.log("User not exist also successfully add in  main database")
            }

        
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
        
    }
    )
)




passport.serializeUser((user,done)=>{
    done(null,user);
})

passport.deserializeUser((user,done)=>{
    done(null,user);
});



// initial google ouath login
app.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));

app.get("/auth/google/callback",passport.authenticate("google",{
    successRedirect: process.env.LOCAL_HOST + "/home",
    failureRedirect: process.env.LOCAL_HOST,
}))

app.get("/login/sucess",async(req,res)=>{
    console.log("start login")
    console.log(req.user)

    try{
        if(req.user){
            const ValidUserOne = await userdb.findOne({ email: req.user.email });       
            
            const token = await ValidUserOne.generateAuthtoken();
    
            return res.status(201).json({ status: 201, ValidUserOne,token:token });
    
        }

    const userbyfb = await userdb.findOne({ facebookid: profile.id });
    console.log("userlogin"+userbyfb)
    const token = await ValidUserOne.generateAuthtoken();
    
    return res.status(201).json({ status: 201, userbyfb,token:token });

    }catch(error){

        res.status(400).json({message:"Google Authentication error try again..!"})

    }


})

app.listen(port,()=>{
    console.log(`server start at port no : ${port}`);
})