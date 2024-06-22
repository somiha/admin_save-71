const express = require("express");
const {
  addEmployee,
  addEmployeePost,
  getAllEmployees,
  viewEmployee,
} = require("../controllers/addEmployee.controller");
const router = express.Router();

router.get("/addEmployee", addEmployee);
router.post("/addEmployee", addEmployeePost);
router.get("/allEmployees", getAllEmployees);

router.get("/employees/:admin_id/view", viewEmployee);

module.exports = router;
