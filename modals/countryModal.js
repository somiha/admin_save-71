const db = require("../config/database.config");

exports.getAllCountries = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM country", (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};
