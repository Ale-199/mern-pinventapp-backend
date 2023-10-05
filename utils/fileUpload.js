const multer = require("multer");

// Define file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //second parameter is the folder name, where we are going to store the file
    //-We also need to specify it in the server.js
    cb(null, "uploads");
  },
  //-Define the name where we want to save the file as.
  filename: function (req, file, cb) {
    cb(
      null,
      //-toISOString() method is used to convert the given data object's contents into a
      //string in ISO format (ISO 8601) i.e, in the form of (YYYY-MM-DDTHH:mm:ss. sssZ or ±YYYYYY-MM-DDTHH:mm:ss. sssZ).
      //-We want to replace / to -
      //-We want to replace it globally
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

//Specify file format that can be saved
function fileFilter(req, file, cb) {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    //-This true means allow file to upload
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
});

//File Size formatter
const fileSizeFormatter = (bytes, decimal) => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const dm = decimal || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "YB", "ZB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  return (
    parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + " " + sizes[index]
  );
};

module.exports = {
  upload,
  fileSizeFormatter,
};
