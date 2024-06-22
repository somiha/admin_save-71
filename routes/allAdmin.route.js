const express = require("express");
const {
  getAllAdmins,
  viewAdmin,
  updateAdminInfo,
  deleteAdmin,
  deleteSelectedAdmins,
} = require("../controllers/allAdmin.controller");
const upload = require("../config/multer_admin.config");
const router = express.Router();

router.get("/sub-admins", getAllAdmins);
router.get("/sub-admins/:admin_id/view", viewAdmin);
router.post(
  "/sub-admins/:admin_id/update",
  upload.fields([
    { name: "profile_pic", maxCount: 1 },
    { name: "passport_pdf", maxCount: 1 },
  ]),
  updateAdminInfo
);
router.get("/sub-admins/:admin_id/delete", deleteAdmin);
router.post("/sub-admins/delete", deleteSelectedAdmins);

router.get("/unauthorized", (req, res) => {
  res.render("unauthorized");
});

module.exports = router;
