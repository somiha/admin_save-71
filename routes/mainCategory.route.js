const express = require("express");
const { mainCategory, getMainProducts, mainCatAdd, mainCatDel, mainCatEdit } = require("../controllers/mainCategory.controller");
const router = express.Router();

router.get("/mainCategory", mainCategory);
router.get("/mainCatDel/:id", mainCatDel);
router.post("/maincat", mainCatAdd);
router.post("/mainCatEdit/:id", mainCatEdit);
router.get("/api/getMainProducts/:page", getMainProducts);

module.exports = router;