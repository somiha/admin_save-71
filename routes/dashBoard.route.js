const express = require("express");
const {
  dashBoard,
  getProducts,
  dashBoardBranded,
  getBrandedProducts,
  delBrandedProducts,
  productStat,
  productVis,
  productFilter,
} = require("../controllers/dashBoard.controller");
const router = express.Router();

router.get("/", dashBoard);
router.get("/api/products", getProducts);
router.post("/productStat", productStat);
router.get("/productVis/:pId/:currentVis", productVis);
router.get("/productFilter/:filter", productFilter);

router.get("/branded", dashBoardBranded);
router.get("/api/brandedProducts", getBrandedProducts);
router.get("/delBrandedProducts/:id", delBrandedProducts);

module.exports = router;
