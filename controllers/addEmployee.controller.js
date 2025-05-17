const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
const countryModal = require("../modals/countryModal");
const adminInfoModal = require("../modals/adminInfoModal");
const helper = require("../helper/index");
const { queryAsyncWithoutValue } = require("../config/helper");

exports.addEmployee = async (req, res) => {
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

    const admin = await adminModel.getAdminById(req, res, adminData.admin_id);
    const allPermissions = await adminModel.getAllPermissions();
    const countries = await countryModal.getAllCountries();

    // filter premissions from allPermission which has admin.permissions array
    let filteredPermissions = allPermissions;
    if (!admin.is_super_admin) {
      filteredPermissions = Object.entries(allPermissions).reduce(
        (acc, [group, permissions]) => {
          const filteredGroupPermissions = permissions.filter((permission) =>
            admin.permissions.includes(permission.permission_id)
          );
          if (filteredGroupPermissions.length > 0) {
            acc[group] = filteredGroupPermissions;
          }
          return acc;
        },
        {}
      );
    }

    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );
    const designations = await queryAsyncWithoutValue(
      `SELECT * FROM designation;`
    );
    // const userId = req.session.user_id;
    return res.render("addEmployee", {
      title: "Add Employee",
      permissions: filteredPermissions,
      countries,
      premissions,
      admin,
      designations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// exports.addAdminPost = (req, res) => {
//   try {
//     const adminData = JSON.parse(
//       crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
//     );

//     if (!adminData || !adminData.is_logged) {
//       if (adminData.otp !== true) {
//         console.log("OTP not verified");
//         return res.redirect("/otp");
//       } else {
//         console.log("Admin not logged in");
//         return res.redirect("/login");
//       }
//     }

//     const { name, email, password, permissions } = req.body;

//     const sql =
//       "INSERT INTO `admin_info` (`admin_id`, `admin_name`, `admin_email`, `admin_pass`, `permissions`, `is_super_admin`) \
//       VALUES (NULL, ?, ?, ?, ?, '0')";
//     db.query(
//       sql,
//       [name, email, crypto.encrypt(password), JSON.stringify(permissions)],
//       (err, result) => {
//         if (err) {
//           console.error(err);
//           if (err.code === "ER_DUP_ENTRY") {
//             return res.status(400).send("Email already exists");
//           }
//           return res.status(500).send("Internal Server Error");
//         }
//         res.redirect("/sub-admins");
//       }
//     );
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Internal Server Error");
//   }
// };

exports.addEmployeePost = (req, res) => {
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

    let {
      name,
      email,
      password,
      country,
      note,
      designation,
      permissions,
      is_manager,
      salary,
      number,
    } = req.body;
    const uniqueId = helper.genertateUniqueId();
    const permissionsArray = permissions
      ? Array.isArray(permissions)
        ? permissions
        : [permissions]
      : [];

    if (!is_manager) {
      is_manager = 0;
    } else {
      is_manager = 1;
    }

    const sql =
      "INSERT INTO `admin_info` (`admin_id`, `admin_name`, `admin_email`, `admin_pass`, `note`, `country_id`, `designation`, `permissions`, `is_employee`, `unique_id`, referrer, is_manager, salary_per_hour, mobile_number) \
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [
        name,
        email,
        crypto.encrypt(password),
        note,
        country,
        designation,
        JSON.stringify(permissionsArray),
        1,
        uniqueId,
        adminData.admin_id,
        is_manager,
        salary,
        number,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).send("Email already exists");
          }
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/myEmployees");
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const adminInfo = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!adminInfo || !adminInfo.is_logged) {
      if (adminInfo.otp !== true) {
        return res.redirect("/otp");
      } else {
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
    const employess = await adminModel.getAllEmployee(
      req,
      res,
      admin.admin_id,
      page,
      limit
    );

    const total_pages = Math.ceil(employess.totalAdmins / limit);

    const admin_info = employess.admins;
    // return res.send("OK");

    // console.log(allPermissions);
    return res.render("allEmployees", {
      title: "All Employees",
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

exports.getMyEmployees = async (req, res) => {
  try {
    const adminInfo = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!adminInfo || !adminInfo.is_logged) {
      if (adminInfo.otp !== true) {
        return res.redirect("/otp");
      } else {
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
    const employess = await adminModel.getPaginatedEmployee(
      req,
      res,
      admin.admin_id,
      page,
      limit
    );
    // console.log(employess.admins);
    const total_pages = Math.ceil(employess.totalAdmins / limit);
    // console.log(total_pages);
    const admin_info = employess.admins;
    // return res.send("OK");

    // console.log(allPermissions);
    return res.render("myEmployees", {
      title: "All Employees",
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

exports.viewEmployee = async (req, res) => {
  try {
    const adminInfo = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!adminInfo || !adminInfo.is_logged) {
      if (adminInfo.otp !== true) {
        return res.redirect("/otp");
      } else {
        return res.redirect("/login");
      }
    }
    const admin_id = req.params.admin_id;
    const admin = await adminModel.getAdminById(req, res, adminInfo.admin_id);
    const subAdmin = await adminModel.getAdminById(req, res, admin_id);

    let referrerInfo = {};
    if (subAdmin.referrer) {
      referrerInfo = await adminModel.getAdminById(req, res, subAdmin.referrer);
    }

    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );

    const allPermissions = await adminModel.getAllPermissions(req, res);
    let filteredGroupPermissions = allPermissions;
    if (!admin.is_super_admin) {
      filteredGroupPermissions = Object.entries(allPermissions).reduce(
        (acc, [group, permissions]) => {
          const filteredGroupPermissions = permissions.filter((permission) =>
            referrerInfo.permissions.includes(permission.permission_id)
          );
          if (filteredGroupPermissions.length > 0) {
            acc[group] = filteredGroupPermissions;
          }
          return acc;
        },
        {}
      );
    }
    const countries = await countryModal.getAllCountries();
    const bankInfo = await adminModel.getAdminBankInfo(admin_id);
    const docs = await adminInfoModal.getDocuments(admin_id);
    const designations = await queryAsyncWithoutValue(
      "SELECT * FROM designation"
    );
    const allManagers = await queryAsyncWithoutValue(
      `SELECT * FROM admin_info WHERE is_manager = 1 AND admin_id != ${admin_id}`
    );

    if (admin) {
      return res.render("employeeProfile", {
        title: "Employee Profile",
        subAdmin: subAdmin,
        Permissions: filteredGroupPermissions,
        countries,
        bankInfo,
        premissions,
        admin,
        referrerInfo,
        designations,
        allManagers,
        docs,
      });
    } else {
      res.status(404).send("Admin not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.viewSubAdminEmployee = async (req, res) => {
  try {
    const adminInfo = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!adminInfo || !adminInfo.is_logged) {
      if (adminInfo.otp !== true) {
        return res.redirect("/otp");
      } else {
        return res.redirect("/login");
      }
    }

    const admin_id = req.params.admin_id;

    const admin = await adminModel.getAdminById(res, req, adminInfo.admin_id);
    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const employess = await adminModel.getPaginatedEmployee(
      req,
      res,
      admin_id,
      page,
      limit
    );
    const total_pages = Math.ceil(employess.totalAdmins / limit);

    const admin_info = employess.admins;
    // return res.send("OK");

    // console.log(allPermissions);
    return res.render("employees", {
      title: "All Employees",
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

exports.updateEmployeeInfo = async (req, res) => {
  try {
    console.log("Test");
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
      reporting_manager,
      is_manager,
    } = req.body;

    if (!is_manager) {
      is_manager = 0;
    } else {
      is_manager = 1;
    }

    console.log({ is_manager });

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

    // console.log(passportPdfPath, profilePicPath);

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
      passport_pdf,
      is_manager,
      reporting_manager
    );

    if (updatedAdmin) {
      res.redirect("/myEmployees");
    } else {
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
