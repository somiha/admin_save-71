const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, "../public/images/admin");
    console.log({ file, destinationPath });
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Maintain original file extension if it's allowed, otherwise convert to webp
    const finalExtension = allowedExtensions.includes(fileExtension)
      ? fileExtension
      : ".webp";
    cb(null, uniqueSuffix + finalExtension);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
