const express = require("express");
const { commission } = require("../controllers/commission.controller");
const router = express.Router();

router.get("/commission", commission);

module.exports = router;
