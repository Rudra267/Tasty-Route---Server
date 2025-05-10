const mongoose = require("mongoose");


const RsgtResturant = new mongoose.Schema({

    Name:{
        type:String
    },
    Location:{
        type:String
    },
    Contract:{
     type:String
    },
    AboutTheResturant:{
        type:String
    }
  
})

const RgstResturant = new mongoose.model("NewRegisterResturant's",RsgtResturant );

module.exports = RgstResturant;