const express = require("express");
const {
  adminSettings,
  adminSettingsPost,
  adminBankInfoPost,
  adminDocumentsPost,
  adminOtp,
} = require("../controllers/adminSettings.controller");

const upload = require("../config/multer_admin.config");
const router = express.Router();

router.get("/adminSettings", adminSettings);
router.post("/adminSettings", adminSettingsPost);
router.post("/adminSettings/otp", adminOtp);

router.post("/adminSettingsBankInfo", adminBankInfoPost);
router.post(
  "/adminSettingsDocuments",
  upload.fields([
    { name: "profile_pic", maxCount: 1 },
    { name: "passport_pdf", maxCount: 1 },
  ]),
  adminDocumentsPost
);

module.exports = router;
