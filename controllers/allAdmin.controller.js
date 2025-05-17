const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
const mult_upload = require("../config/multer_product.config");
const { all } = require("axios");
const countryModal = require("../modals/countryModal");
const adminInfoModal = require("../modals/adminInfoModal");
const { queryAsyncWithoutValue, queryAsync } = require("../config/helper");
const db = require("../config/database.config");

exports.getAllAdmins = async (req, res) => {
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
    const subAdmins = await adminModel.getPaginatedAdmins(
      req,
      res,
      page,
      limit
    );

    const total_pages = Math.ceil(subAdmins.totalAdmins / limit);

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
    const designations = await queryAsyncWithoutValue(
      `SELECT * FROM designation;`
    );
    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );

    const allPermissions = await adminModel.getAllPermissions(req, res);
    const countries = await countryModal.getAllCountries();
    const bankInfo = await adminModel.getAdminBankInfo(admin_id);
    const docs = await adminInfoModal.getDocuments(admin_id);

    if (admin) {
      // console.log(admin);

      return res.render("adminProfile", {
        title: "Admin Profile",
        subAdmin: subAdmin,
        Permissions: allPermissions,
        countries,
        bankInfo,
        premissions,
        admin,
        referrerInfo,
        designations,
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
      reporting_manager,
      is_manager,
    } = req.body;

    if (!is_manager) {
      is_manager = 0;
    } else {
      is_manager = 1;
    }

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
      res.redirect("/sub-admins");
    } else {
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// exports.approveOrRejectTask = async (req, res) => {
//   try {
//     const { taskId, status } = req.body;

//     db.query(
//       "UPDATE task_log SET is_approved = ? WHERE id = ?",
//       [status, taskId],
//       (err, result) => {
//         if (err) {
//           console.error(err);
//           res.status(500).send("Internal Server Error");
//         } else {
//           res.json({
//             message: "Task status updated successfully",
//             success: true,
//           });
//           return;
//         }
//       }
//     );
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Internal Server Error");
//   }
// };

const addAdminSalary = async (emp_id, salaryToAdd) => {
  const empSalary = await queryAsync(
    `SELECT * FROM admin_salary WHERE emp_id = ?`,
    [emp_id]
  );

  if (empSalary.length > 0) {
    const totalSalary = parseInt(empSalary[0].salary) + parseInt(salaryToAdd);
    await queryAsync(`UPDATE admin_salary SET salary = ? WHERE emp_id = ?`, [
      totalSalary,
      emp_id,
    ]);
  } else {
    await queryAsync(
      `INSERT INTO admin_salary (emp_id, salary) VALUES (?, ?)`,
      [emp_id, salaryToAdd]
    );
  }
};

exports.approveOrRejectTask = async (req, res) => {
  try {
    const { taskId, status } = req.body;

    db.query(
      "UPDATE task_log SET is_approved = ? WHERE id = ?",
      [status, taskId],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        console.log(status);
        if (status == 1) {
          console.log("Task approved");

          db.query(
            "SELECT emp_id, task_duration FROM task_log WHERE id = ?",
            [taskId],
            (err, taskResult) => {
              if (err || taskResult.length === 0) {
                console.error(err || "Task not found");
                return res.status(500).send("Internal Server Error");
              }

              const { emp_id, task_duration } = taskResult[0];

              let decimalHours = 0;
              try {
                if (task_duration.includes(":")) {
                  const [hours, minutes] = task_duration
                    .split(":")
                    .map((part) => parseInt(part.trim()) || 0);
                  decimalHours = hours + minutes / 60;
                }
                // Then try comma format (HH,MM)
                else if (task_duration.includes(",")) {
                  const [hours, minutes] = task_duration
                    .split(",")
                    .map((part) => parseInt(part.trim()) || 0);
                  decimalHours = hours + minutes / 60;
                } else {
                  decimalHours = parseFloat(task_duration) || 0;
                }
              } catch (e) {
                console.error("Error parsing task duration:", e);
                return res.status(400).send("Invalid task duration format");
              }

              db.query(
                "SELECT salary_per_hour FROM admin_info WHERE admin_id = ?",
                [emp_id],
                (err, salaryResult) => {
                  if (err || salaryResult.length === 0) {
                    console.error(err || "Employee salary not found");
                    return res.status(500).send("Internal Server Error");
                  }

                  const salaryPerHour = salaryResult[0].salary_per_hour;
                  const salaryToAdd = parseFloat(
                    decimalHours * salaryPerHour
                  ).toFixed(2);

                  db.query(
                    "UPDATE task_log SET salary = ? WHERE id = ?",
                    [salaryToAdd, taskId],
                    (err, updateResult) => {
                      if (err) {
                        console.error(err);
                        return res.status(500).send("Internal Server Error");
                      }

                      addAdminSalary(emp_id, salaryToAdd);

                      res.json({
                        message:
                          "Task approved and salary updated successfully",
                        success: true,
                        salaryAdded: salaryToAdd,
                        hoursWorked: decimalHours.toFixed(2),
                      });
                    }
                  );
                }
              );
            }
          );
        } else {
          res.json({
            message: "Task status updated successfully",
            success: true,
          });
        }
      }
    );
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
