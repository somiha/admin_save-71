const express = require("express");
const { otp, verifyOTP, resendOTP } = require("../controllers/otp.controller");
const router = express.Router();

router.get("/otp", otp);
router.post("/otp", verifyOTP);
router.get("/resend", resendOTP);

module.exports = router;
