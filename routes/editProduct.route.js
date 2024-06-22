const express = require("express");
const { editProduct, editProductPost, delImage, delVideo } = require("../controllers/editProduct.controller");
const router = express.Router();

router.get("/editProduct/:pID", editProduct);
router.get("/delImage/:pID", delImage);
router.get("/delVideo/:pID", delVideo);
router.post("/editProduct/:pID", editProductPost);

module.exports = router;