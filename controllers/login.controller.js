const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const crypto = require("../middlewares/crypto");
const path = require("path");
const auth = require("../middlewares/auth");
const otpHelper = require("../middlewares/otpHelper");
const mult_upload = require("../config/multer_category.config");

exports.login = (req, res) => {
  const aIE = crypto.decrypt(req.cookies.aIE || "");
  const aLm = crypto.decrypt(req.cookies.aLm || "");
  return res.render("login", {
    email: aIE,
    login_message: aLm,
    title: "Login",
  });
};

exports.loginPost = (req, res) => {
  const { email, pass } = req.body;
  res.cookie("aIE", crypto.encrypt(email), {
    maxAge: 900000,
    httpOnly: true,
  });

  if (email && pass) {
    db.query(
      "SELECT * FROM admin_info WHERE admin_email = ?",
      [email],
      (err, result) => {
        if (err) {
          console.error(err);
          res.cookie("aLm", crypto.encrypt("An error occurred !"), {
            maxAge: 1000,
            httpOnly: true,
          });
          res.redirect("/login");
        } else {
          if (
            result.length > 0 &&
            crypto.compareEncryptedData(pass, result[0].admin_pass)
          ) {
            const encAdminData = auth.getUserData(
              req,
              true,
              result[0].admin_id
            );
            res.cookie("__aD", encAdminData, {
              maxAge: 24 * 60 * 60 * 1000,
              httpOnly: true,
            }); // 1 day
            const setOTP = otpHelper.setOTPCode(result[0].admin_id);
            res.cookie(
              "_oM",
              crypto.encrypt("OTP has been sent to <b>" + email + "</b> !"),
              {
                maxAge: 5 * 1000,
                httpOnly: true,
              }
            ); // 1 second

            res.redirect("/otp");
          } else {
            res.cookie("aLm", crypto.encrypt("Invalid Email or Password!"), {
              maxAge: 1000,
              httpOnly: true,
            }); // 1 second
            res.redirect("/login");
          }
        }
      }
    );
  } else {
    res.cookie("aLm", crypto.encrypt("Please fill in all fields!"), {
      maxAge: 1000,
      httpOnly: true,
    }); // 1 second
    res.redirect("/login");
    // res.end();
  }
};

exports.logout = (req, res) => {
  res.clearCookie("__aD");
  res.redirect("/login");
};
