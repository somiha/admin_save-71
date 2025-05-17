const express = require("express");
const {
  addEmployee,
  addEmployeePost,
  getAllEmployees,
  viewEmployee,
  viewSubAdminEmployee,
  getMyEmployees,
  updateEmployeeInfo,
} = require("../controllers/addEmployee.controller");

const {
  getAddDesignation,
  addDesignation,
  getAddEditDesignation,
} = require("../controllers/designation.controller");
const upload = require("../config/multer_admin.config");
const router = express.Router();

router.get("/addEmployee", addEmployee);
router.post("/addEmployee", addEmployeePost);
router.get("/allEmployees", getAllEmployees);
router.get("/myEmployees", getMyEmployees);

router.get("/designation", getAddDesignation);
router.get("/get-add-designation", getAddEditDesignation);
router.post("/add-designation", addDesignation);

router.get("/employees/:admin_id/view", viewEmployee);

router.get("/sub-admin/employees/:admin_id/view", viewSubAdminEmployee);
router.post(
  "/employees/:admin_id/update",
  upload.fields([
    { name: "profile_pic", maxCount: 1 },
    { name: "passport_pdf", maxCount: 1 },
  ]),
  updateEmployeeInfo
);

module.exports = router;
