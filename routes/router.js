const express = require("express");
const router = new express.Router();
const userdb = require("../models/userSchema");
var bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const jwt = require("jsonwebtoken");
const otpgenerate = require("otp-generator");
const optSchema = require("../models/otpSchema");
// const { v4: uuidv4 } = require('uuid');
const otpSchema = require("../models/otpSchema");
const twilio = require("twilio");
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const SECRET_KEY = process.env.SECRET_KEY
const nodemailer = require("nodemailer");
// const {storage,upload} = require("./imageUpload")
// const cloudinary = require('../helper/cloudcongif')
const multer = require('multer');
const RgstResturant = require("../models/resturantRegister");
const ResturantData = require("../models/RestaurantData");
const ScheduledPayment = require('../models/ScheduledPayment'); 
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('cloudinary').v2;
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const Address = require('../models/Address.js');



//twilioCleint
const twilioclient = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

// Initialize Cloudinary with your credentials
cloudinary.config({
    cloud_name: 'dscn0os4j',
    api_key: '344338565395725',
    api_secret: 'yACXcIAO_O_hbDVM7DstIMbMJ00'
});


//userregister
// upload.single('image')
router.post("/register", async (req, res) => {

    const { fullname, email, mobilenumber, password, confirmpassword } = req.body;
    console.log(req.body)

    if (!fullname || !email || !password || !confirmpassword || !mobilenumber) {
        return res.status(422).json({ error: "Please fill all the details" });
    }

    try {
        const preuser = await userdb.findOne({ email: email });

        // console.log("preuser",preuser);

        if (preuser) {
            return res.status(422).json({ message: "This Email is Already Exist",status: 422 });
        } else if (password !== confirmpassword) {
            return res.status(422).json({ error: "Password and Confirm Password do not match" });
        } else {

            // Upload image to Cloudinary
            // const result = await cloudinary.uploader.upload(req.file.path);
            // console.log(result)
            // const image = { url: result.secure_url, public_id: result.public_id };
           

            const finalUser = new userdb({
                fullname, email, password, mobilenumber
                // , image
            });

            // Hash the password before saving it (ensure you have bcrypt installed)
            // finalUser.password = await bcrypt.hash(password, 10);

            const storeData = await finalUser.save();
            return res.status(201).json({ status: 201, storeData });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// user Login
router.post("/login", async (req, res) => {
    // console.log(req.body);

    const { email, password } = req.body;

    // console.log(req.body)

    if (!email || !password) {
        res.status(422).json({ error: "fill all the details" })
    }

    try {
        const userValid = await userdb.findOne({ email: email });

        if (userValid) {

            const isMatch = await bcrypt.compare(password, userValid.password);

            if (!isMatch) {
                res.status(422).json({ error: "invalid details" })
            } else {
                // token generate
                const token = await userValid.generateAuthtoken();

                // cookiegenerate
                res.cookie("usercookie", token, {
                    
                    httpOnly: true
                });

                const result = {
                    userValid,
                    token
                }
            
                res.status(201).json({ status: 201, result })
            }
        } else {
            res.status(401).json({ message: "Authentication Failed !" })
        }

    } catch (error) {
        res.status(401).json(error);
        console.log(error);
    }
});

// user valid
router.get("/validuser", authenticate, async (req, res) => {
    console.log("valid : ",req.cookies)
    try {
        const ValidUserOne = await userdb.findOne({ _id: req.userId });
        res.status(201).json({ status: 201, ValidUserOne });
    } catch (error) {
        res.status(401).json({ status: 401, error });
    }
});

//accessuserdatas
router.get("/accessData", async (req, res) => {

    try {
        const token = await req.cookies.usercookie

        const data = jwt.verify(token, SECRET_KEY)
        const id = data._id

        const userValid = await userdb.findOne({ _id: id });
        if (!userValid) {
            return res.status(404).json({ message: "User not found" });
        } else {
            console.log(userValid)
        }

    } catch (error) {
        // console.log(error)
        return res.status(401).json({message:"function server error try again.."})
    }
})

// user logout
router.get("/logout", authenticate, async (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
            return curelem.token !== req.token
        });

        res.clearCookie("usercookie", { path: "/login" });

        req.rootUser.save();

        res.status(201).json({ status: 201 })

    } catch (error) {
        res.status(401).json({ status: 401, error })
    }
})

//forgotpassword
router.post('/email-otp-forgetpassword', async (req, res) => {
const {useremail} = req.body

 try {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "nrudra550@gmail.com",
                pass: "pgfyfvaxzuwnnirv"
            }
        });

        const otp = await otpgenerate.generate(6)
        const cDate = new Date();

        const mailOptions = {
            from: "nrudra550@gmail.com",
            to: useremail,
            subject: "OTP Verification",
            html: `  <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2;color: #0000009f">
            <div style="margin:50px auto;width:70%;padding:100px 100px;border:2px solid #47A997;">
              <div style="border-bottom:1px solid #eee">
                <a href="https://www.theunpadh.com/" style="color: #47A997;text-decoration:none;font-weight:600"><img width="100px" src="https://i.pinimg.com/280x280_RS/a4/aa/00/a4aa0059b78329d4ef14ba29358028d1.jpg"></a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>You've requested to reset your password on Unpadh Learning Platform. Use the following OTP to verify your email and proceed with the password reset. The OTP is valid for 3 minutes.</p>
              <h2 style="background: #47A997;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
              <p>If you didn't request this OTP or if you have any concerns regarding your account security, please ignore this email or contact our support team immediately.</p>
              <p style="font-size:0.9em;">Regards,<br />Unpadh</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Unpadh Inc</p>
                <p>Hn-258 2Nd Floor Dhaka Gaon, Landmark Shiv Mandir, Newdelhi North West</p>
                <p>Delhi, India, 110009</p>
              </div>
            </div>
        </div>
        `
        };

        await res.cookie('newemail', useremail, {
            expires: new Date(Date.now() + 2 * 60 * 1000),
            httpOnly: true
        })


        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                res.status(401).json({ error: "something is  wrong" });
            } else {
                // console.log(info.response);
                await otpSchema.findOneAndUpdate({ email: useremail }, { $set: { emailverifiedotp: otp, otpExpiration: new Date(cDate.getTime()) } }, { upsert: true, new: true, setDefaultsOnInsert: true })
                res.status(200).json({ message: "successfully send...", success: true ,status:201})
            }
        })

    } catch (error) {
        res.status(401).json({ error })
    }

})

router.post('/forgetPassword',async(req,res)=>{

    const {otp,password,confirmpassword} = req.body
    const email = await req.cookies.newemail

    // console.log(email)

try{

    const user = await otpSchema.findOne({email:email})

    if(password === confirmpassword){

        if(user.emailverifiedotp === otp){

            const bcryptpass = await bcrypt.hash(password,12)

            await userdb.findOneAndUpdate({ email: email}, { $set: {password:bcryptpass} }, { upsert: true, new: true, setDefaultsOnInsert: true })
                res.status(200).json({ message: "Update successfully", success: true,status:201 })


        }else{
            res.status(401).json({message:"otp not match"})
        }
    

    }else{
        res.status(401).json({message:"password not match"})
    }


}catch(error){
    console.log(error)
}
})

//updatepassword
router.post('/updatepassword', async (req, res) => {

    try {

        const { oldpassword, newpassword, confirmpassword } = req.body

        const token = await req.cookies.usercookie

        if (newpassword !== confirmpassword) {
            return res.status(401).json({ message: "new password and confim password not matched" })
        }

        if (!token) {
            res.status(401).json({ message: "try again to update your password after once login again" })
            console.log("token problem");
        }

        let id = jwt.verify(token, SECRET_KEY)

        const userValid = await userdb.findOne({ _id: id })

        const isMatch = await bcrypt.compare(oldpassword, userValid.password);

        if (isMatch) {

            const hashpassword = await bcrypt.hash(newpassword, 12);

            const result = await userdb.findOneAndUpdate({ _id: id }, { $set: { password: hashpassword } });

            res.status(201).json({ message: "password updated" });
            console.log("password updated");

        } else {
            console.log("not match")
        }

    } catch (error) {
        res.status(500).json({ message: "update password server error" })
    }
})

//signoutfrom alldevice[mobile,desktop]
router.get('/logoutfromalldevice', async (req, resp) => {
    try {
        const token = req.cookies.usercookie;
        if (!token) {
            return resp.status(401).json({ message: "No token provided" });
        }

        const id = jwt.verify(token, SECRET_KEY);

        if (!id) {
            return resp.status(401).json({ message: "Invalid token" });
        }

        const userValid = await userdb.findOne({ _id: id._id });
    

        if (!userValid) {
            return resp.status(404).json({ message: "User not found" });
        }

        // Clear all tokens
        userValid.tokens = [];
        await userValid.save();

        resp.clearCookie("usercookie", { path: "/" });

        return resp.status(201).json({ message: 'Successfully signed out from all devices',status:201});
    } catch (error) {
        // console.error("Error signing out from all devices:", error);
        return resp.status(500).json({ message: "Internal server error" });
    }
});

//accoount delete
router.post('/useraccountdelete', async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = req.cookies.usercookie;
        let id;

        try {
            id = jwt.verify(token, SECRET_KEY);
        } catch (error) {
            // console.log("JWT verification failed:", error);
            return res.status(401).json({ message: "Authentication failed" });
        }

        const existinguser = await userdb.findOne({ _id: id });

        if (!existinguser) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        if (existinguser.email === email) {
            if (!password) {
                throw new Error("Password field is missing");
            }

            const isMatch = await bcrypt.compare(password, existinguser.password);

            if (isMatch) {
                await userdb.findOneAndDelete({ email: existinguser.email });
                // console.log("Account deleted");
                return res.status(201).json("Account Delete Successfully");
            } else {
                // console.log("Authentication failed: Incorrect password");
                return res.status(401).json({ message: "Authentication failed" });
            }
        } else {
            // console.log("Authentication failed: Email mismatch");
            return res.status(401).json({ message: "Authentication failed" });
        }
    } catch (error) {
        // console.log("Something went wrong:", error);
        return res.status(401).json({ message: "Something went wrong, please try again" });
    }

})

//profileremove
router.post('/removeprofile', async (req, res) => {
    try {
        const { token } = req.body;
        const userValid = jwt.verify(token, SECRET_KEY);
        const userVerified = await userdb.findOne({ _id: userValid._id });
        const idimg = userVerified.image[0].public_id;

        if (!userVerified) {
            return res.status(401).json({ message: "Update failed !",status:401});
        }
        if(!userVerified.image){
            return res.status(402).json({ message: "Update failed !",status:402});
        }

        cloudinary.uploader
            .destroy(idimg)
            .then(async (result) => {
                console.log("delete");
                // Update user's profile image in the database
                userVerified.image = [];
                await userVerified.save();
                console.log("database updated for profile image");
                
                // Send response after database update
                return res.status(201).json({
                    message: "success",
                    result,
                    status:201
                });
            })
            .catch((error) => {
                console.log(error);
                return res.status(401).json({
                    message: "Failure",
                    error,
                });
            });
    } catch (error) {
        return res.status(500).json(error);
    }
});

//profileupdate
router.post('/profileupdate', upload.single('image'), async (req, res) => {
    const id = req.body.id;

    const userValid = await userdb.findOne({ _id: id });

    if (!userValid) {
        return res.status(404).json({ error: "User not found" });
    }

    try {

        // if (userValid.image.length >= 0) {

        //     userValid.image = []
        //     userValid.save()
        // }

        const result = await cloudinary.uploader.upload(req.file.path);
        console.log(result)

        const updatedImage = { url: result.secure_url, public_id: result.public_id };

        await userdb.findOneAndUpdate({ _id: id }, { $set: { image: updatedImage } }, { upsert: true, new: true, setDefaultsOnInsert: true });

        res.status(201).json({ message: "Profile image updated", success: true,status:201});
        console.log("Profile image updated");


    } catch (error) {

        res.status(401).json({ message: "Profile image updated"});

    }


});

//email-otpsend
router.post('/mail-otpsend', async (req, res) => {
    const { useremail } = req.body;
    let otp; // Declare otp variable here

    try {
        otp = otpgenerate.generate(6); // Assign otp here

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "nrudra550@gmail.com",
                pass: "pgfyfvaxzuwnnirv"
            }
        });

        const cDate = new Date();

        const mailOptions = {
            from: "nrudra550@gmail.com",
            to: useremail,
            subject: "OTP Verification",
            html: ` <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2;color: #0000009f">
        <div style="margin:50px auto;width:70%;padding:100px 100px;border:2px solid #f40a0a;">
        <div style="border-bottom:1px solid #eee">
                <a href="https://www.TastyRoute.com/" style="color: #e80d0d;text-decoration:none;font-weight:600"><img width="100px" src="https://res.cloudinary.com/dscn0os4j/image/upload/v1712116975/res-logo_m7wlyi.png"></a>
                <h3><span style="font-size: larger;">T</span>asty Route</h3>
              </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>Thank you for choosing Tasty Route Food Delivary Platform. Use the following OTP to complete your Sign Up procedures. OTP is valid for 3 minutes</p>
          <h2 style="background: #47A997;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
          <p>If you did not request this OTP or if you have any concerns regarding your account security, please contact our support team immediately.<p/>
          <p style="font-size:0.9em;">Regards,<br />Tasty Route</p>
          <hr style="border:none;border-top:1px solid #eee" />
          <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
            <p>Unpadh Inc</p>
            <p>Hn-258 2Nd Floor Dhaka Gaon, Landmark Shiv Mandir, Newdelhi North West</p>
            <p>Delhi, India, 110009</p>
          </div>
        </div>
      </div>
        `
        };

        await res.cookie('newemail', useremail, {
            expires: new Date(Date.now() + 2 * 60 * 1000),
            httpOnly: true
        })


        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                res.status(401).json({ error: "something is  wrong" });
            } else {
                console.log(info.response);
                await otpSchema.findOneAndUpdate({ email: useremail }, { $set: { emailverifiedotp: otp, otpExpiration: new Date(cDate.getTime()) } }, { upsert: true, new: true, setDefaultsOnInsert: true })
                res.status(200).json({ message: "successfully send...", success: true })
            }
        })

    } catch (error) {
        res.status(401).json({ error })
    }

})


//email-otpverify
router.post('/mail-otpverify', async (req, res) => {

    const { otp } = req.body
    try {

        const email = req.cookies.newemail

        const userValid = await otpSchema.findOne({ email: email });
        if (!userValid) {
            return res.status(401).json({ message: "try again for validation!" });
        }

        if (userValid.emailverifiedotp !== otp) {
            return res.status(401).json({ message: "Invalid OTP! Please try again." });
        }

        res.status(200).json({ message: "Email verified successfully", success: true });

    } catch (error) {

        console.error(error);
        res.status(401).json({ message: "OTP verifying error, please try again!" });
    }
})

//mobilenumber-otpverify
router.post('/mobilenumber-otpverify', async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(401).json({ message: "Required to enter the received OTP for verifying!" });
        }

        const hashValue = req.cookies.mobile;

        if (!hashValue) {
            return res.status(401).json({ message: "Time limit expired, try again!" });
        }

        const mobile = await jwt.verify(hashValue, SECRET_KEY);
        const mobileNumber = mobile.mobilenumber;

        const userValid = await otpSchema.findOne({ mobilenumber: mobileNumber });

        if (!userValid) {
            return res.status(401).json({ message: "User not found!" });
        }

        if (userValid.otp !== otp) {
            return res.status(401).json({ message: "Invalid OTP! Please try again." });
        }

        res.status(200).json({ message: "Mobile number verified successfully", success: true });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "OTP verifying error, please try again!" });
    }
});

//mobilenumber-otpsend
router.post('/mobilenumber-otpsend', async (req, res) => {
    try {
        const { mobilenumber } = req.body
        const otp = otpgenerate.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
        const cDate = new Date();
        const hashingmobilenumber = await jwt.sign({ mobilenumber }, SECRET_KEY);

        res.cookie('mobile', hashingmobilenumber, {
            expires: new Date(Date.now() + 2 * 60 * 1000),
            httpOnly: true
        })

        await otpSchema.findOneAndUpdate({ mobilenumber: mobilenumber }, { $set: { otp, otpExpiration: new Date(cDate.getTime()) } }, { upsert: true, new: true, setDefaultsOnInsert: true })

        await twilioclient.messages.create({
            body: `Tasty Route verified OTP is: ${otp}`,
            to: mobilenumber,
            from: TWILIO_PHONE_NUMBER
        })

        console.log(otp);

        res.status(200).json({ message: "Otp send successfully", success: true });

    } catch (error) {
        console.log(error);
        res.status(401).json({ message: "Somthing went rough in server try again" });

    }
})

router.post('/mail-message', async (req, res) => {
    const { useremail } = req.body
    console.log(useremail)

    try {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "nrudra550@gmail.com",
                pass: "pgfyfvaxzuwnnirv"
            }
        });

        const mailOptions = {
            from: "nrudra550@gmail.com",
            to: useremail,
            subject: "Thank You for Connecting with Tasty Route!",
            html: ` <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2;color: #0000009f">
            <div style="margin:50px auto;width:70%;padding:100px 100px;border:2px solid #f40a0a;">
              <div style="border-bottom:1px solid #eee">
                <a href="https://www.TastyRoute.com/" style="color: #e80d0d;text-decoration:none;font-weight:600"><img width="100px" src="https://res.cloudinary.com/dscn0os4j/image/upload/v1712116975/res-logo_m7wlyi.png"></a>
                <h3><span style="font-size: larger;">T</span>asty Route</h3>
              </div>
              <h5 style="font-size:1.1em">Hi Dear,</h5>
              <p>
      
              I hope this email finds you well.</p>
              <p>I wanted to personally reach out and extend my sincerest gratitude for connecting with Tasty Route, your go-to destination for delicious food delivery. Your support means the world to us, and we're thrilled to have you as a valued member of our community.
      
              Rest assured that we're diligently working to ensure your experience with Tasty Route is nothing short of exceptional. From browsing our mouthwatering menu options to swift and seamless delivery, we're committed to providing you with top-notch service every step of the way.
              
              As a token of our appreciation, we'll keep you updated with the latest offers, promotions, and exclusive deals tailored just for you. So, be sure to keep an eye on your inbox for some tempting treats!
              
              Once again, thank you for choosing Tasty Route. We're truly grateful for your support, and we look forward to serving you delicious meals that satisfy your cravings.
              
              If you have any questions or need assistance, please don't hesitate to reach out. Our dedicated team is here to ensure your Tasty Route experience is nothing short of delightful.
              
              Warm regards,<p/>
              <h5 style="font-size:0.9em;">Regards,<br />From Tasty Route Technical Department</h5>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Tasty Route</p>
                <p>Hn-258 2Nd Floor Dhaka Gaon, Landmark Shiv Mandir, Newdelhi North West</p>
                <p>Delhi, India, 110009</p>
              </div>
            </div>
          </div>
        `
        };


        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                res.status(401).json({ error: "something is  wrong",error });
            } else {
                console.log(info.response);
                res.status(200).json({ message: "successfully send...", success: true })
            }
        })

    } catch (error) {
        res.status(401).json({ error })
    }

})

router.post('/register-resturant',async(req,res)=>{
    const {name, location,contract,aboutTheResturant} = req.body

    console.log(req.body)

    try {
        const preuser = await RgstResturant.findOne({ Contract:contract  });

        if (preuser) {
            return res.status(422).json({ error: "already registered",status:422 });
        } else {

            // Upload image to Cloudinary
            // const result = await cloudinary.uploader.upload(req.file.path);
            // console.log(result)
            // const image = { url: result.secure_url, public_id: result.public_id };
           

            const finalUser = new RgstResturant({
                Name:name , Location:location, Contract:contract, AboutTheResturant:aboutTheResturant
                // , image
            });

            // Hash the password before saving it (ensure you have bcrypt installed)
            // finalUser.password = await bcrypt.hash(password, 10);

            const storeData = await finalUser.save();
            return res.status(201).json({ status: 201, storeData });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
   
})

module.exports = router;

//filtering resturant

// Route to insert data
router.post('/restaurants', async (req, res) => {
    try {
        // Create a new restaurant object based on the request body
        const restaurantData = new ResturantData(req.body); // Corrected variable name
        // Save the restaurant object to the database
        const savedRestaurant = await restaurantData.save();
        res.status(201).json(savedRestaurant); // Respond with the saved restaurant data
    } catch (error) {
        res.status(400).json({ message: error.message }); // If an error occurs, respond with the error message
    }
});

router.post('/restaurantsFind', async (req, res) => {
    try {
        // Create a new restaurant object based on the request body
        const restaurantData = await ResturantData.find({}) // Corrected variable name
        // Save the restaurant object to the database
        
        res.status(201).json(restaurantData); // Respond with the saved restaurant data
    } catch (error) {
        res.status(400).json({ message: error.message }); // If an error occurs, respond with the error message
    }
});

// extract menus

router.get('/menus', async (req, res) => {
    try {
        // Find all restaurants
        const restaurants = await ResturantData.find({}, 'menus');

        if (!restaurants) {
            return res.status(404).json({ message: 'No restaurants found' });
        }

       

        // Extract menus from each restaurant
        const allMenus = restaurants.map(restaurant => ({
            restaurantName: restaurant.name,
            menus: {
                breakfast: restaurant.menus.breakfast,
                lunch: restaurant.menus.lunch,
                dinner: restaurant.menus.dinner
            }
        }));

        // Return all menus
        res.json(allMenus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

//extract dishes

router.get('/dishes', async (req, res) => {
    try {
        // Find all restaurants
        const restaurants = await ResturantData.find({}, 'menus');

        if (!restaurants) {
            return res.status(404).json({ message: 'No restaurants found' });
        }

        // Extract all dishes from each restaurant's menu
        const allDishes = restaurants.reduce((accumulator, restaurant) => {
            accumulator.push(...restaurant.menus.breakfast);
            accumulator.push(...restaurant.menus.lunch);
            accumulator.push(...restaurant.menus.dinner);
            return accumulator;
        }, []);

        // Return all dishes
        res.json(allDishes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

//resturant Datas
router.get('/restaurants', async (req, res) => {
    try {
        // Fetch all restaurants from the database
        const restaurants = await ResturantData.find();

        // Return the fetched restaurants
        res.json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

//resturant individual fetch by id
router.get('/restaurants/:id', async (req, res) => {
    const restaurantId = req.params.id;

    try {
        // Find restaurant by _id
        const restaurant = await ResturantData.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Return the restaurant data
        res.json(restaurant);
    } catch (error) {
        console.error('Error fetching restaurant by _id:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

//location based
router.post('/LocationRestaurants', async (req, res) => {
    const {location} = req.body;

    try {
        // Find restaurants by location
        const restaurants = await ResturantData.find({ location });

        if (!restaurants.length) {
            return res.status(404).json({ message: 'Restaurants not found in the specified location' });
        }

        // Return the filtered restaurants data
        res.json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants by location:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

//payment
router.post("/create-checkout-session", async (req, res) => {
    try {
      const { products } = req.body;
  
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "Invalid or empty products array" });
      }
  
      console.log("Products received:", products);
  
      const line_items = products.map((product) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: product.title,
            images: product.image01 ? [product.image01] : [], // avoid undefined
          },
          unit_amount: Math.round(product.price * 100), // Ensure it's an integer
        },
        quantity: product.quantity || 1, // fallback to 1 if undefined
      }));
  
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        success_url: "http://localhost:3000/checkout",
        cancel_url: "http://localhost:3000/checkoutFailed",
      });
  
      res.status(200).json({ id: session.id, url: session.url }); // optional: send url too
    } catch (error) {
      console.error("Stripe session creation error:", error.message);
      res.status(500).json({ error: "Failed to create Stripe session" });
    }
  });
  

router.post('/api/pay-later', async (req, res) => {
    const { dueDate, cartItems, totalAmount, payLaterCharge } = req.body;

    // console.log(dueDate, cartItems, totalAmount);
  
    // Validate input
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart items are required and must be an array.' });
    }
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: 'Total amount must be a positive number.' });
    }
  
    try {
      const token = req.cookies.usercookie;
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
  
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded._id;
  
      const userData = await userdb.findOne({ _id: userId });
      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const existingUnpaid = await ScheduledPayment.findOne({
        email: userData.email,
        status: { $ne: 'paid' }
      });
  
      if (existingUnpaid) {
        return res.status(403).json({
          error: 'Pay first your previous order bill.',
          status: 403
        });
      }
  
      const orderId = Math.floor(Math.random() * 90000) + 10000;;
  
      const newPayment = new ScheduledPayment({
        orderId,
        dueDate,
        fullName: userData.fullname,
        email: userData.email,
        mobileNumber: userData.mobilenumber,
        mobileNumberChecked: userData.mobile === 'verified',
        cartItems, // Save the full array
        payLaterCharge,
        totalAmount: totalAmount + payLaterCharge, // <-- FIXED
        status: 'pending'
      });
  
      const savedPayment = await newPayment.save();
      return res.status(201).json({ status: 201, savedPayment });
  
    } catch (error) {
      console.error('Pay-later error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.get('/api/scheduled-payments', async (req, res) => {
    try {
      const payments = await ScheduledPayment.find({});
      res.json(payments);
    } catch (error) {
      console.error('Error fetching scheduled payments:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/api/scheduled-payments/:orderId', async (req, res) => {
    const { orderId } = req.params;
  
    try {
      const payment = await ScheduledPayment.findOne({ orderId });
  
      if (!payment) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      res.status(200).json(payment);
    } catch (error) {
      console.error('Error fetching order:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  


  router.post('/save-address', async (req, res) => {
    try {
      const address = new Address(req.body);
      await address.save();
      res.status(201).json({ success: true, message: 'Address saved successfully' });
    } catch (error) {
      console.error('Error saving address:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  });

  router.get('/save-address', async (req, res) => {
    try {
      const addresses = await Address.find({});
      res.status(200).json({ success: true, addresses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch addresses", error });
    }
  });

  router.delete('/delete-address/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await Address.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Address deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to delete address", error });
    }
  });
  