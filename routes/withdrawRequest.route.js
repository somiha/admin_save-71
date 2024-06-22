const express = require("express");
const { withDrawRequest, getWithDrawRequest, withDrawStatusUpdate, withDrawFilter, withDrawFilterClear } = require("../controllers/withDrawRequest.controller");
const router = express.Router();

router.get("/withdraw", withDrawRequest);
router.get("/api/getWithdraw", getWithDrawRequest);
router.get("/withDrawFilterClear", withDrawFilterClear);
router.post("/withDrawFilter", withDrawFilter);
router.post("/withDrawStatusUpdate", withDrawStatusUpdate);

module.exports = router;