const express = require("express");
const { updateExchange, updateExchangeView } = require("../controllers/updateExchange.controller");
const router = express.Router();

router.get("/updateExchange", updateExchange);
router.get("/updateExchangeView", updateExchangeView);

module.exports = router;