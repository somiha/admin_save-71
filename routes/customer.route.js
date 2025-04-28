const express = require("express");
const { getAllCustomers } = require("../controllers/customer.controller");
const router = express.Router();

router.get("/customers", getAllCustomers);

module.exports = router;
