const express = require("express");
const { withDrawRequest } = require("../controllers/withdrawDetails.controller");
const router = express.Router();

router.get("/withdrawDetails/:trId", withDrawRequest);

module.exports = router;