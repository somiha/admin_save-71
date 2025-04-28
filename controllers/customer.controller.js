const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

const cotuntryModal = require("../modals/countryModal");
const { queryAsync, queryAsyncWithoutValue } = require("../config/helper");

exports.getAllCustomers = async (req, res, next) => {
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
    const customerQuery = `SELECT * FROM user;`;
    const customers = await queryAsyncWithoutValue(customerQuery);
    const page = parseInt(req.query.page) || 1;
    const customersPerPage = 8;
    const startIdx = (page - 1) * customersPerPage;
    const endIdx = startIdx + customersPerPage;
    const paginatedCustomers = customers.slice(startIdx, endIdx);
    return res.status(200).render("customer", {
      title: "All Customer",
      customers,
      paginatedCustomers,
      customersPerPage,
      page,
      premissions,
      admin,
      countries,
    });
  } catch (e) {
    console.log(e);
    return res.status(503).json({ msg: "Internal Server Error" });
  }
};
