const db = require("../config/database.config");

exports.commission = (req, res) => {
  return res.render("commission");
};
