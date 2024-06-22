const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
const cotuntryModal = require("../modals/countryModal");
const helper = require("../helper/index");

exports.addAdmin = async (req, res) => {
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
    const countries = await cotuntryModal.getAllCountries();

    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );
    // const userId = req.session.user_id;
    return res.render("addAdmin", {
      title: "Add Admin",
      permissions: allPermissions,
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

exports.addAdminPost = (req, res) => {
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
      "INSERT INTO `admin_info` (`admin_id`, `admin_name`, `admin_email`, `admin_pass`, `note`, `country_id`, `designation`, `permissions`, `is_country_representative`, `unique_id`, referrer) \
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
        res.redirect("/sub-admins");
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
