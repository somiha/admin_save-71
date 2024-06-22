const express = require("express");
const { extraCategory, getExtraProducts, extraCatEdit, addExtraCategory, extraCatDel } = require("../controllers/extraCategory.controller");
const router = express.Router();

router.get("/extraCategory", extraCategory);
router.get("/extraCatDel/:id", extraCatDel);
router.post("/addExtraCategory", addExtraCategory);
router.post("/extraCatEdit/:id", extraCatEdit);
router.get("/api/getExtraProducts/:page", getExtraProducts);

module.exports = router;