const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
const mult_upload = require("../config/multer_product.config");
const { all } = require("axios");
const countryModal = require("../modals/countryModal");
const adminInfoModal = require("../modals/adminInfoModal");

exports.getAllAdmins = async (req, res) => {
  try {
    const adminInfo = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!adminInfo || !adminInfo.is_logged) {
      if (adminInfo.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    const admin = await adminModel.getAdminById(res, req, adminInfo.admin_id);
    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const subAdmins = await adminModel.getPaginatedAdmins(
      req,
      res,
      page,
      limit
    );
    console.log(subAdmins.admins);
    const total_pages = Math.ceil(subAdmins.totalAdmins / limit);
    console.log(total_pages);
    const admin_info = subAdmins.admins;
    // return res.send("OK");

    // console.log(allPermissions);
    return res.render("allAdmins", {
      title: "All Admins",
      subAdmins: admin_info,
      totalPages: total_pages,
      currentPage: page,
      premissions,
      admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.viewAdmin = async (req, res) => {
  try {
    const adminInfo = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!adminInfo || !adminInfo.is_logged) {
      if (adminInfo.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }
    const admin_id = req.params.admin_id;
    const admin = await adminModel.getAdminById(req, res, admin_id);
    let referrerInfo = {};
    if (admin.referrer) {
      referrerInfo = await adminModel.getAdminById(req, res, admin.referrer);
    }

    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );

    const allPermissions = await adminModel.getAllPermissions(req, res);
    const countries = await countryModal.getAllCountries();
    const bankInfo = await adminModel.getAdminBankInfo(admin_id);
    console.log({ bankInfo });
    if (admin) {
      // console.log(admin);
      console.log(allPermissions, admin);
      return res.render("adminProfile", {
        title: "Admin Profile",
        subAdmin: admin,
        Permissions: allPermissions,
        countries,
        bankInfo,
        premissions,
        admin,
        referrerInfo,
      });
    } else {
      res.status(404).send("Admin not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateAdminInfo = async (req, res) => {
  try {
    const admin_id = req.params.admin_id;
    let {
      admin_name,
      admin_email,
      admin_pass,
      note,
      designation,
      is_active,
      country_id,
      bank_name,
      routing_number,
      branch_name,
      account_name,
      account_number,
      permissions,
    } = req.body;

    if (!is_active) {
      is_active = 0;
    } else {
      is_active = 1;
    }

    const adminInfo = await adminInfoModal.getAdminDetails(admin_id);
    const adminBankInfo = await adminModel.getAdminBankInfo(admin_id);
    if (adminBankInfo.length > 0) {
      await adminModel.updateAdminBankInfo(
        admin_id,
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
        admin_id
      );
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
        "http://localhost:3010/images/admin/" +
        req.files.profile_pic[0].filename;
    }
    if (passportPdfPath) {
      passport_pdf =
        "http://localhost:3010/images/admin/" +
        req.files.passport_pdf[0].filename;
    }

    // Ensure permissions is an array
    const permissionsArray = Array.isArray(permissions) ? permissions : [];

    const updatedAdmin = await adminModel.updateAdminInfo(
      req,
      res,
      admin_id,
      admin_name,
      admin_email,
      crypto.encrypt(admin_pass),
      JSON.stringify(permissionsArray),
      note,
      designation,
      is_active,
      country_id,
      profile_pic,
      passport_pdf
    );

    if (updatedAdmin) {
      res.redirect("/sub-admins");
    } else {
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin_info = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_super_admin: 0}"
    );

    if (admin_info.is_super_admin == 0) {
      return res.status(403).send("Unauthorized");
    }

    const admin_id = req.params.admin_id;
    const deletedAdmin = await adminModel.deleteAdmin(req, res, admin_id);
    if (deletedAdmin) {
      res.redirect("/sub-admins");
    } else {
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteSelectedAdmins = async (req, res) => {
  try {
    const admin_info = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_super_admin: 0}"
    );

    if (admin_info.is_super_admin == 0) {
      return res.status(403).send("Unauthorized");
    }

    const selectedAdmins = req.body["selected-admins"];
    // console.log("Selected: ", selectedAdmins);
    const deletedAdmins = await adminModel.deleteSelectedAdmins(
      req,
      res,
      selectedAdmins
    );
    if (deletedAdmins) {
      return res.send("success");
      // res.redirect("/sub-admins");
    } else {
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
