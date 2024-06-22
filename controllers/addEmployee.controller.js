const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
const countryModal = require("../modals/countryModal");
const helper = require("../helper/index");

exports.addEmployee = async (req, res) => {
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
    // const userId = req.session.user_id;
    return res.render("addEmployee", {
      title: "Add Employee",
      permissions: filteredPermissions,
      countries,
      premissions,
      admin,
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
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    const { name, email, password, country, note, designation, permissions } =
      req.body;
    const uniqueId = helper.genertateUniqueId();
    const permissionsArray = permissions
      ? Array.isArray(permissions)
        ? permissions
        : [permissions]
      : [];

    console.log(req.body);

    const sql =
      "INSERT INTO `admin_info` (`admin_id`, `admin_name`, `admin_email`, `admin_pass`, `note`, `country_id`, `designation`, `permissions`, `is_employee`, `unique_id`, referrer) \
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).send("Email already exists");
          }
          return res.status(500).send("Internal Server Error");
        }
        res.redirect("/allEmployees");
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
    const employess = await adminModel.getPaginatedEmployee(
      req,
      res,
      admin.admin_id,
      page,
      limit
    );
    console.log(employess.admins);
    const total_pages = Math.ceil(employess.totalAdmins / limit);
    console.log(total_pages);
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

exports.viewEmployee = async (req, res) => {
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
    const admin = await adminModel.getAdminById(req, res, adminInfo.admin_id);
    let referrerInfo = {};
    if (admin.referrer) {
      referrerInfo = await adminModel.getAdminById(req, res, admin.referrer);
    }

    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );

    console.log({ premissions });

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
    if (admin) {
      return res.render("adminProfile", {
        title: "Employee Profile",
        subAdmin: admin,
        Permissions: filteredGroupPermissions,
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
