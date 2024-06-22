const express = require("express");
const { addProduct, addProductPost } = require("../controllers/addProduct.controller");
const router = express.Router();

router.get("/addProduct", addProduct);
router.post("/addProduct", addProductPost);

module.exports = router;