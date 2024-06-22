const db = require("../config/database.config");
const crypto = require("./crypto");

exports.getAllPermissions = (req, res) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admin_permissions ORDER BY permission_group;",
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          const groupedPermissions = result.reduce((groups, permission) => {
            const group = groups[permission.permission_group] || [];
            group.push(permission);
            groups[permission.permission_group] = group;
            return groups;
          }, {});
          resolve(groupedPermissions);
        }
      }
    );
  });
};

exports.getPaginatedAdmins = (req, res, page = 1, limit = 10) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    db.query(
      "SELECT COUNT(*) as total_admins FROM admin_info WHERE is_super_admin = 0 AND is_country_representative = 1 AND is_employee = 0;",
      (err, countResult) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          const totalAdmins = countResult[0].total_admins;
          db.query(
            `SELECT a1.*, a2.admin_name AS referrer_name
              FROM admin_info a1
              LEFT JOIN admin_info a2 ON a1.referrer = a2.admin_id
              WHERE a1.is_super_admin = 0 AND a1.is_country_representative = 1 AND a1.is_employee = 0
              LIMIT ?, ?;
              `,
            [offset, limit],
            (err, admins) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                admins.forEach((admin) => (admin.admin_pass = undefined));
                resolve({ totalAdmins, admins });
              }
            }
          );
        }
      }
    );
  });
};

exports.getPaginatedEmployee = (req, res, referrer, page = 1, limit = 10) => {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    db.query(
      "SELECT COUNT(*) as total_admins FROM admin_info WHERE is_super_admin = 0 AND is_employee = 1 AND referrer = ?;",
      [referrer],
      (err, countResult) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          const totalAdmins = countResult[0].total_admins;
          db.query(
            `SELECT a1.*, a2.admin_name AS referrer_name
              FROM admin_info a1
              LEFT JOIN admin_info a2 ON a1.referrer = a2.admin_id
              WHERE a1.is_super_admin = 0 AND a1.is_employee = 1 AND a1.referrer = ?
              LIMIT ?, ?;
              `,
            [referrer, offset, limit],
            (err, admins) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                admins.forEach((admin) => (admin.admin_pass = undefined));
                resolve({ totalAdmins, admins });
              }
            }
          );
        }
      }
    );
  });
};

exports.getAdminById = (req, res, admin_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admin_info WHERE admin_id = ?",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          if (result.length > 0) {
            result[0].admin_pass = crypto.decrypt(result[0].admin_pass);
            resolve(result[0]);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
};

exports.createAdminBankInfo = (
  bank_name,
  routing_number,
  branch_name,
  account_name,
  account_number,
  admin_id
) => {
  console.log("createAdminBankInfo");
  const insertQuery =
    "INSERT INTO `admin_bank_info` (`bank_name`, `routing_number`, `branch_name`, `account_name`, `account_number`, `admin_id`) VALUES (?, ?, ?, ?, ?, ?) ";
  return new Promise((resolve, reject) => {
    db.query(
      insertQuery,
      [
        bank_name,
        routing_number,
        branch_name,
        account_name,
        account_number,
        admin_id,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.getAdminPremissions = (is_super_admin, permission_ids) => {
  // make permission_ids string array to array
  permission_ids = JSON.parse(permission_ids);
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM admin_permissions", [], (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        if (result.length > 0) {
          let permissions;
          if (typeof result[0].permissions === "string") {
            permissions = JSON.parse(result[0].permissions);
          } else {
            permissions = result[0].permissions;
          }

          // Check if any of the permission_ids are in the admin's permissions
          const permissionIdsStr = permission_ids.map(String);

          let permissionIds = permissionIdsStr.map((id) => parseInt(id, 10));

          // Filter the result array based on permission_id
          let filteredAccessLinks = [];
          console.log({ is_super_admin });
          if (!is_super_admin) {
            filteredAccessLinks = result
              ?.filter((item) => permissionIds.includes(item.permission_id))
              .map((item) => JSON.parse(item.access_links).links)
              .flat();
          } else {
            filteredAccessLinks = result
              ?.map((item) => JSON.parse(item.access_links).links)
              .flat();
          }

          // list all premissions

          resolve(filteredAccessLinks);
        } else {
          resolve([]);
        }
      }
    });
  });
};

exports.getAdminBankInfo = (admin_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM `admin_bank_info` WHERE `admin_id` = ?",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.updateAdminBankInfo = (
  admin_id,
  bank_name,
  routing_number,
  branch_name,
  account_name,
  account_number
) => {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE `admin_bank_info` SET `bank_name` = ?, `routing_number` = ?, `branch_name` = ?, `account_name` = ?, `account_number` = ? WHERE `admin_id` = ?;",
      [
        bank_name,
        routing_number,
        branch_name,
        account_name,
        account_number,
        admin_id,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.updateAdminDocuments = (admin_id, profile_pic, passport_pdf) => {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE admin_info SET profile_pic = ?, passport_pdf = ? WHERE admin_id = ?;",
      [profile_pic, passport_pdf, admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.updateAdminInfo = (
  req,
  res,
  admin_id,
  admin_name,
  admin_email,
  admin_pass,
  admin_permissions,
  note,
  designation,
  is_active,
  country_id,
  profile_pic,
  passport_pdf
) => {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE admin_info SET admin_name = ?, admin_pass = ?, admin_email = ?, permissions = ?, note = ?, designation = ?, is_active = ?, country_id = ?, profile_pic = ?, passport_pdf = ? WHERE admin_id = ?;",
      [
        admin_name,
        admin_pass,
        admin_email,
        admin_permissions,
        note,
        designation,
        is_active,
        country_id,
        profile_pic,
        passport_pdf,
        admin_id,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.deleteAdmin = (req, res, admin_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "DELETE FROM admin_info WHERE admin_id = ?;",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.deleteSelectedAdmins = (req, res, admin_ids) => {
  return new Promise((resolve, reject) => {
    db.query(
      "DELETE FROM admin_info WHERE admin_id IN (?);",
      [admin_ids],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};
