const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
exports.aboutUs = async (req, res) => {
  try {
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

    db.query("SELECT * FROM `site_info`", (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      const site_info = res1[0];
      return res.render("site_info", {
        site_info: {
          title: "About Us",
          description: site_info.about_us,
          post_link: "/about-us",
        },
        premissions,
        admin,
      });
    });
  } catch (error) {
    console.error(error);
    res.send("Internal Server Error");
  }
};

exports.privacy_policy = async (req, res) => {
  try {
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
    db.query("SELECT * FROM `site_info`", (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      const site_info = res1[0];
      return res.render("site_info", {
        site_info: {
          title: "Privacy Policy",
          description: site_info.privacy_policy,
          post_link: "/privacy-policy",
        },
        premissions,
        admin,
      });
    });
  } catch (err) {
    console.error(err);
    res.send("Internal Server Error");
  }
};

exports.terms_condition = async (req, res) => {
  try {
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
    db.query("SELECT * FROM `site_info`", (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      const site_info = res1[0];
      return res.render("site_info", {
        site_info: {
          title: "Terms & Condition",
          description: site_info.terms_and_condition,
          post_link: "/terms-and-conditions",
        },
        premissions,
        admin,
      });
    });
  } catch (error) {
    console.error(error);
    res.send("Internal Server Error");
  }
};

exports.aboutUsPost = (req, res) => {
  const { product_des } = req.body;
  db.query(
    "UPDATE `site_info` SET `about_us` = ?",
    [product_des],
    (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      res.redirect("/about-us");
    }
  );
};

exports.privacyPolicyPost = (req, res) => {
  const { product_des } = req.body;
  db.query(
    "UPDATE `site_info` SET `privacy_policy` = ?",
    [product_des],
    (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      res.redirect("/privacy-policy");
    }
  );
};

exports.termsConditionPost = (req, res) => {
  const { product_des } = req.body;
  db.query(
    "UPDATE `site_info` SET `terms_and_condition` = ?",
    [product_des],
    (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      res.redirect("/terms-and-conditions");
    }
  );
};

exports.brand_guidelines = async (req, res) => {
  try {
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
    db.query("SELECT * FROM `site_info`", (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      const site_info = res1[0];
      return res.render("site_info", {
        site_info: {
          title: "Brand Guidelines",
          description: site_info.brand_guidelines,
          post_link: "/brand-guidelines",
        },
        premissions,
        admin,
      });
    });
  } catch (error) {
    console.error(error);
    res.send("Internal Server Error");
  }
};

exports.brandGuidelinesPost = (req, res) => {
  const { product_des } = req.body;
  db.query(
    "UPDATE `site_info` SET `brand_guidelines` = ?",
    [product_des],
    (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      res.redirect("/brand-guidelines");
    }
  );
};

exports.notice = async (req, res) => {
  try {
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
    db.query("SELECT * FROM `site_info`", (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      const site_info = res1[0];
      return res.render("site_info", {
        site_info: {
          title: "Notice",
          description: site_info.notice,
          post_link: "/notice",
        },
        premissions,
        admin,
      });
    });
  } catch (error) {
    console.error(error);
    res.send("Internal Server Error");
  }
};

exports.noticePost = (req, res) => {
  const { product_des } = req.body;
  db.query(
    "UPDATE `site_info` SET `notice` = ?",
    [product_des],
    (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      res.redirect("/notice");
    }
  );
};

exports.contact_us = async (req, res) => {
  try {
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
    db.query("SELECT * FROM `site_info`", (err1, res1) => {
      if (err1) {
        console.error(err1);
        res.send("Internal Server Error");
        return;
      }
      const site_info = res1[0];
      return res.render("site_info", {
        site_info: {
          title: "Contact Us",
          description: site_info.contact_us,
          post_link: "/contact-us",
        },
        premissions,
        admin,
      });
    });
  } catch (error) {
    console.log(error);
    return res.send("Internal Server Error");
  }
};

exports.contactUsPost = async (req, res) => {
  try {
    const { product_des } = req.body;
    db.query(
      "UPDATE `site_info` SET `contact_us` = ?",
      [product_des],
      (err1, res1) => {
        if (err1) {
          console.error(err1);
          res.send("Internal Server Error");
          return;
        }
        res.redirect("/contact-us");
      }
    );
  } catch (error) {
    console.log(error);
    return res.send("Internal Server Error");
  }
};
