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
        return res.redirect("/otp");
      } else {
        return res.redirect("/login");
      }
    }

    const admin = await adminModel.getAdminById(res, req, admin_info.admin_id);
    const bankInfo = await adminModel.getAdminBankInfo(admin_info.admin_id);
    const message = crypto.decrypt(req.cookies.__mOA || "");
    const docs = await adminInfoModal.getDocuments(admin_info.admin_id);
    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );
    const adminId = admin_info.admin_id;
    return res.render("adminSettings", {
      title: "Admin Settings",
      message,
      admin,
      bankInfo,
      premissions,
      docs,
      adminId,
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
        return res.redirect("/otp");
      } else {
        return res.redirect("/login");
      }
    }

    const { otp } = req.body;
    const { email, name, password } = JSON.parse(req.body.formData);
    const dbOtp = await otpHelper.getOTPByAdminId(adminData.admin_id);

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

    if (!adminData || !adminData.is_logged) {
      if (adminData.otp !== true) {
        return res.redirect("/otp");
      } else {
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
        return res.redirect("/otp");
      } else {
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

    if (profilePicPath) {
      profile_pic =
        "https://admin.saveneed.com/images/admin/" +
        req.files.profile_pic[0].filename;
    }
    if (passportPdfPath) {
      passport_pdf =
        "https://admin.saveneed.com/images/admin/" +
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

exports.documentsPost = async (req, res) => {
  try {
    const encryptedData = req.cookies.__aD || "";
    const decryptedData = crypto.decrypt(encryptedData) || "{}";
    const adminData = JSON.parse(decryptedData);

    // ✅ Check if admin is logged in
    if (!adminData || !adminData.is_logged) {
      return res.redirect(adminData.otp === true ? "/otp" : "/login");
    }

    const admin_id = adminData.admin_id;
    const adminInfo = await adminInfoModal.getDocuments(admin_id);
    let files = adminInfo[0]?.files || [];

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    // ✅ Process uploaded file
    if (req.file) {
      const fileUrl =
        "https://admin.saveneed.com/images/admin/" + req.file.filename;
      files = [fileUrl]; // You can also keep old files if needed
    }

    const title = req.body.title;

    await adminModel.addDocuments(admin_id, title, files);

    res.redirect("/adminSettings");
  } catch (err) {
    console.error("Document Upload Error:", err);
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
        return res.redirect("/otp");
      } else {
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
