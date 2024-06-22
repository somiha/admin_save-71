const express = require("express");
const {
  aboutUs,
  privacy_policy,
  terms_condition,
  aboutUsPost,
  privacyPolicyPost,
  termsConditionPost,
  brand_guidelines,
  brandGuidelinesPost,
  notice,
  noticePost,
  contact_us,
  contactUsPost,
} = require("../controllers/site_info.controller");
const router = express.Router();

router.get("/about-us", aboutUs);
router.get("/privacy-policy", privacy_policy);
router.get("/terms-and-conditions", terms_condition);
router.get("/brand-guidelines", brand_guidelines);
router.get("/notice", notice);
router.get("/contact-us", contact_us);

router.post("/about-us", aboutUsPost);
router.post("/privacy-policy", privacyPolicyPost);
router.post("/terms-and-conditions", termsConditionPost);
router.post("/brand-guidelines", brandGuidelinesPost);
router.post("/notice", noticePost);
router.post("/contact-us", contactUsPost);

module.exports = router;
