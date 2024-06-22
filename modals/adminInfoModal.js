const db = require("../config/database.config");

exports.getAdminDetails = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admin_info WHERE admin_id = ? ",
      [id],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
};
