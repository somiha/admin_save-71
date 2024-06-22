const db = require("../config/database.config");
const hf = require("./helperFunctions");

exports.setOTPCode = (admin_id, sub = "Admin Login OTP") => {
  return new Promise((resolve, reject) => {
    const otp = hf.generateOTP();
    db.query(
      "SELECT * FROM `admin_info` WHERE `admin_id` = ?",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          return reject(err);
        }

        if (result.length > 0) {
          const admin_email = result[0].admin_email;
          db.query(
            "INSERT INTO `admin_otp` (`admin_id`, `otp_code`, `email`) VALUES (?, ?, ?);",
            [admin_id, otp, admin_email],
            (err, result) => {
              if (err) {
                console.error(err);
                return reject(err);
              }

              // send otp to email
              hf.mailSend(admin_email, otp, sub);

              console.log("OTP generated successfully.");
              return resolve(result);
            }
          );
        } else {
          return reject("Admin not found.");
        }
      }
    );
  });
};
exports.deleteOTPByAdminId = (admin_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "DELETE FROM `admin_otp` WHERE `admin_id` = ?;",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          return reject(err);
        }

        return resolve(result);
      }
    );
  });
};

exports.getOTPByAdminId = (admin_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM `admin_otp` WHERE `admin_id` = ? ORDER BY generate_time DESC;",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          return reject(err);
        }

        return resolve(result);
      }
    );
  });
};
