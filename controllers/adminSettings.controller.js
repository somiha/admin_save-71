const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
const otpHelper = require("../middlewares/otpHelper");
const hf = require("../middlewares/helperFunctions");
const mult_upload = require("../config/multer_product.config");
const adminInfoModal = require("../modals/adminInfoModal");

exports.adminSettings = async (req, res) => {
  try {
    const admin_info = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!admin_info || !admin_info.is_logged) {
      if (admin_info.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    const admin = await adminModel.getAdminById(res, req, admin_info.admin_id);
    const bankInfo = await adminModel.getAdminBankInfo(admin_info.admin_id);
    const message = crypto.decrypt(req.cookies.__mOA || "");
    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );
    console.log(`admin settings permissions: ${premissions}`);
    console.log(`admin settings admin: ${admin}`);

    return res.render("adminSettings", {
      title: "Admin Settings",
      message,
      admin,
      bankInfo,
      premissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.adminSettingsPost = async (req, res) => {
  try {
    const adminData = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );

    if (!adminData || !adminData.is_logged) {
      if (adminData.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    const { otp } = req.body;
    const { email, name, password } = JSON.parse(req.body.formData);
    const dbOtp = await otpHelper.getOTPByAdminId(adminData.admin_id);
    console.log(dbOtp);

    if (dbOtp[0].email !== email) {
      return res.status(400).send("Email not matched with admin email");
    }

    if (dbOtp[0].otp_code !== otp) {
      return res.status(400).send("Invalid OTP");
    }

    const sql =
      "UPDATE `admin_info` SET `admin_name` = ?, `admin_email` = ?, `admin_pass` = ? WHERE `admin_id` = ?";
    db.query(
      sql,
      [name, email, crypto.encrypt(password), adminData.admin_id],
      async (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }
        res.cookie("___mOA", crypto.encrypt("Settings Updated !"), {
          maxAge: 1000 * 10,
        });
        await otpHelper.deleteOTPByAdminId(adminData.admin_id);
        res.status(200).send("Settings Updated !");
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.adminBankInfoPost = async (req, res) => {
  try {
    const adminData = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );

    console.log({ adminData }, adminData.admin_id);

    if (!adminData || !adminData.is_logged) {
      if (adminData.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    const {
      bank_name,
      account_name,
      account_number,
      routing_number,
      branch_name,
    } = req.body;

    const bankInfo = await adminModel.getAdminBankInfo(adminData.admin_id);

    if (bankInfo.length > 0) {
      await adminModel.updateAdminBankInfo(
        adminData.admin_id,
        bank_name,
        routing_number,
        branch_name,
        account_name,
        account_number
      );
    } else {
      await adminModel.createAdminBankInfo(
        bank_name,
        routing_number,
        branch_name,
        account_name,
        account_number,
        adminData.admin_id
      );
    }
    res.redirect("/adminSettings");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.adminDocumentsPost = async (req, res) => {
  try {
    const adminData = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );

    const adminInfo = await adminInfoModal.getAdminDetails(adminData.admin_id);

    if (!adminData || !adminData.is_logged) {
      if (adminData.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    let profile_pic = adminInfo[0].profile_pic;
    let passport_pdf = adminInfo[0].passport_pdf;

    const profilePicPath = req.files.profile_pic
      ? req.files.profile_pic[0].path
      : null;
    const passportPdfPath = req.files.passport_pdf
      ? req.files.passport_pdf[0].path
      : null;

    console.log(passportPdfPath, profilePicPath);

    if (profilePicPath) {
      profile_pic =
        "https://admin.save71.com/images/admin/" +
        req.files.profile_pic[0].filename;
    }
    if (passportPdfPath) {
      passport_pdf =
        "https://admin.save71.com/images/admin/" +
        req.files.passport_pdf[0].filename;
    }

    await adminModel.updateAdminDocuments(
      adminData.admin_id,
      profile_pic,
      passport_pdf
    );

    res.redirect("/adminSettings");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.adminOtp = async (req, res) => {
  try {
    const admin_info = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!admin_info || !admin_info.is_logged) {
      if (admin_info.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    const email = req.body.email;

    const admin = await adminModel.getAdminById(res, req, admin_info.admin_id);
    if (admin.admin_email !== email) {
      return res.status(400).send("Email not matched with admin email");
    }

    const otp = await otpHelper.setOTPCode(
      admin_info.admin_id,

      "Admin Info Update OTP"
    );
    if (!otp) {
      return res.status(500).send("Internal Server Error");
    }

    const message = crypto.encrypt("Otp Sent to : " + email + " !");
    res.cookie("__mOA", message, { maxAge: 1000 * 10 });
    res.status(200).send("OTP Sent to your email.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
