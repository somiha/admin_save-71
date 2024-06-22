const express = require("express");
const { earningHistory } = require("../controllers/earningHistory.controller");
const router = express.Router();

router.get("/earningHistory", earningHistory);

module.exports = router;