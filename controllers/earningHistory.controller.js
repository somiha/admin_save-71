const db = require("../config/database.config");

exports.earningHistory = (req, res) => {
  return res.render("earningHistory");
};
