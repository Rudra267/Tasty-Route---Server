const multer = require("multer");

const Storage = multer.diskStorage({
    destination: function(req,res,cb){
        cb(null,"uploads/")
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now()
        cb(null, uniqueSuffix + file.originalname);
    },
});

const isImage = (req,file,callback)=>{
    if(file.mimetype.startsWith("image")){
        callback(null,true)
    }else{
        callback(new Error("only images is allow"))
    }
}

const load = multer({
    storage: Storage,
    fileFilter:isImage

}).single('image'); // Make sure to match the field name with your frontend form

module.exports = { Storage, load };