const { queryAsync, queryAsyncWithoutValue } = require("../config/helper");
const adminModel = require("../middlewares/admin");
const adminInfoModal = require("../modals/adminInfoModal");
const crypto = require("../middlewares/crypto");

exports.getAddDesignation = async (req, res) => {
  const designations = await queryAsyncWithoutValue(
    `SELECT * FROM designation;`
  );

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

  res.render("designation", { designations, premissions, admin });
};

exports.getAddEditDesignation = async (req, res) => {
  const { id } = req.query;
  let designation = null;
  if (id) {
    designation = await queryAsyncWithoutValue(
      `SELECT * FROM designation WHERE id=${id};`
    );
  }

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

  res.render("addOrEditDesignation", { designation, premissions, admin, id });
};

exports.addDesignation = async (req, res) => {
  const { name, id } = req.body;

  if (id) {
    const updateQuery = `UPDATE designation SET name='${name}' WHERE id=${id};`;
    await queryAsync(updateQuery);
  } else {
    const addQuery = `INSERT INTO designation (name) VALUES ('${name}');`;
    await queryAsync(addQuery);
  }

  const designations = await queryAsyncWithoutValue(
    `SELECT * FROM designation;`
  );

  res.redirect("/designation");
};
