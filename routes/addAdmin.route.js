const express = require("express");
const {
  addAdmin,
  addAdminPost,
} = require("../controllers/addAdmin.controller");
const router = express.Router();

router.get("/addAdmin", addAdmin);
router.post("/addAdmin", addAdminPost);

module.exports = router;
