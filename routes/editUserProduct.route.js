const express = require("express");
const { editProduct, editProductPost, delImage, delVideo } = require("../controllers/editUserProduct.controller");
const router = express.Router();

router.get("/editUserProduct/:pID", editProduct);
router.get("/delUserImage/:pID", delImage);
router.get("/delUserVideo/:pID", delVideo);
router.post("/editUserProduct/:pID", editProductPost);

module.exports = router;