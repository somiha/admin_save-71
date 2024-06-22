const express = require("express");
const { productPreview, previewDelete } = require("../controllers/productPreview.controller");
const router = express.Router();

router.post("/productPreview", productPreview);
router.post("/previewDelete", previewDelete);

module.exports = router;