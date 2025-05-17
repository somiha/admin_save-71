const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const crypto = require("../middlewares/crypto");
const path = require("path");
const auth = require("../middlewares/auth");
const otpHelper = require("../middlewares/otpHelper");
const mult_upload = require("../config/multer_category.config");

exports.otp = async (req, res) => {
  // render otp page
  const _oM = crypto.decrypt(req.cookies._oM || "");
  // console.log("OTP message:", _oM);
  return res.render("otp", {
    title: "OTP Verification",
    message: _oM || "",
  });
};

exports.verifyOTP = async (req, res) => {
  try {
    // take otp from body and admin_id from the cookies then verify the otp
    const { otp } = req.body;
    const { __aD } = req.cookies;
    if (!__aD) {
      return res.redirect("/login");
    }

    const decrypted = crypto.decrypt(__aD);
    const { is_logged, admin_id } = JSON.parse(decrypted);

    if (!is_logged || !admin_id) {
      return res.redirect("/login");
    }

    await auth.verifyOTP(req, res, otp);
    return;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Failed to verify OTP." });
  }
};

exports.resendOTP = async (req, res) => {
  const resend_duration = 2; // in minutes

  try {
    // resend otp
    const { __aD } = req.cookies;
    if (!__aD) {
      return res.redirect("/login");
    }

    const decrypted = crypto.decrypt(__aD);
    const { is_logged, admin_id } = JSON.parse(decrypted);

    if (!is_logged || !admin_id) {
      return res.redirect("/login");
    }

    const otpDetails = await otpHelper.getOTPByAdminId(admin_id);
    // check current otp generate_time is more than 1 minute
    const otp_time = otpDetails[0].generate_time;
    const current_time = new Date().getTime();
    const diff = current_time - otp_time;
    if (diff < resend_duration * 60 * 1000) {
      res.cookie(
        "_oM",
        crypto.encrypt(
          `Please wait for ${
            resend_duration - Math.floor(diff / 60000)
          } seconds to resend OTP.`
        ),
        {
          maxAge: 5 * 1000,
          httpOnly: true,
        }
      );
      return res.redirect("/otp");
    }

    if (otpDetails.length > 0) {
      await otpHelper.deleteOTPByAdminId(admin_id);
      await otpHelper.setOTPCode(admin_id);
      res.cookie(
        "_oM",
        crypto.encrypt(
          "OTP has been resent to <b>" +
            otpDetails[0].email +
            "</b> ! <br/> <i>Only the last OTP is valid.</i>"
        ),
        {
          maxAge: 5 * 1000,
          httpOnly: true,
        }
      );
      return res.redirect("/otp");
    } else {
      return res.status(404).json({ message: "OTP not found." });
    }
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({ message: "Failed to add category." });
  }
};
