const express = require("express");
const { subCategory, getSubProducts, subCatAdd, subCatDel, subCatEdit } = require("../controllers/subCategory.controller");
const router = express.Router();

router.get("/subCategory", subCategory);
router.get("/subCatDel/:id", subCatDel);
router.post("/subCat", subCatAdd);
router.post("/subCatEdit/:id", subCatEdit);
router.get("/api/getSubProducts/:page", getSubProducts);

module.exports = router;