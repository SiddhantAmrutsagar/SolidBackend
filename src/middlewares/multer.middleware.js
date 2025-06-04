import multer from "multer";

const storage = multer.diskStorage({ //multer.diskStorage() set how and where to store files
  destination: function (req, file, cb) { //destination: tells Multer where to save the file locally.
    cb(null, "./public/temp")
  },
  //filename: tells multer what name to save the files as(in this case, original name).
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

// upload becomes a middleware that can be plugged into routes.
export const upload = multer({ 
    storage, 
})