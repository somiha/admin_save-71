const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

exports.dashBoard = async (req, res) => {
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

    const [mainCat, subCat, extraCat, allCat, images, users] =
      await Promise.all([
        catModel.fetchMainCat(),
        catModel.fetchSubCat(),
        catModel.fetchExtraCat(),
        catModel.fetchAllCat(),
        catModel.fetchFeaturedImages(),
        catModel.fetchAllUserInfo(),
      ]);

    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const filter = req.cookies.filter ? req.cookies.filter : 0;
    const filterQuery = [
      "",
      "WHERE status = 1",
      "WHERE status = 2",
      "WHERE status = 3",
      "WHERE admin_published = 0",
      "WHERE admin_published = 1",
    ];

    // console.log("filter : \n", filter, filterQuery[filter])

    db.query(
      `SELECT * FROM products ${filterQuery[filter]} ORDER BY product_id DESC`,
      (err1, res1) => {
        if (err1) {
          console.error(err1);
          return res.status(500).send("Internal Server Error");
        }

        const paginatedProducts = res1.slice(startIndex, endIndex);
        // console.log(paginatedProducts[0])
        const totalPages = Math.ceil(res1.length / itemsPerPage);
        return res.render("dashBoard", {
          products: paginatedProducts,
          images: images,
          extraCat: extraCat,
          currentPage: currentPage,
          totalPages: totalPages,
          users,
          premissions,
          admin,
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.dashBoardBranded = async (req, res) => {
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

    const [mainCat, subCat, extraCat, allCat, images, tempImages] =
      await Promise.all([
        catModel.fetchMainCat(),
        catModel.fetchSubCat(),
        catModel.fetchExtraCat(),
        catModel.fetchAllCat(),
        catModel.fetchFeaturedImages(),
        catModel.fetchFeaturedTempImages(),
      ]);

    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    db.query(
      "SELECT * FROM `product_template` ORDER BY temp_id DESC",
      (err1, res1) => {
        if (err1) {
          console.error(err1);
          return res.status(500).send("Internal Server Error");
        }

        const paginatedProducts = res1.slice(startIndex, endIndex);
        const totalPages = Math.ceil(res1.length / itemsPerPage);

        return res.render("dashBoardBranded", {
          products: paginatedProducts,
          images: tempImages,
          extraCat: extraCat,
          currentPage: currentPage,
          totalPages: totalPages,
          premissions,
          admin,
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = req.cookies.__p || 1;

    const [mainCat, subCat, extraCat, allCat, images, users] =
      await Promise.all([
        catModel.fetchMainCat(),
        catModel.fetchSubCat(),
        catModel.fetchExtraCat(),
        catModel.fetchAllCat(),
        catModel.fetchFeaturedImages(),
        catModel.fetchAllUserInfo(),
      ]);
    try {
      const currentPage = parseInt(req.query.page) || page;
      // update the page cookie
      res.cookie(
        "__p",
        currentPage,
        { path: "/" },
        { maxAge: 2 * 60 * 60 * 1000 }
      );

      const itemsPerPage = 10;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const filter = req.cookies.filter ? req.cookies.filter : 0;
      const filterQuery = [
        "",
        "WHERE status = 1",
        "WHERE status = 2",
        "WHERE status = 3",
        "WHERE admin_published = 0",
        "WHERE admin_published = 1",
      ];

      const searchTerm = req.query.search || "";

      var query = `SELECT * FROM products ${filterQuery[filter]}`;

      if (searchTerm) {
        if (filter == 0) query += ` WHERE product_name LIKE '%${searchTerm}%'`;
        else query += ` AND product_name LIKE '%${searchTerm}%'`;
      }
      query += ` ORDER BY product_id DESC`;

      db.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        const extraCatLookup = extraCat.reduce((lookup, cat) => {
          lookup[cat.extra_cat_id] = cat.extra_cat_name;
          return lookup;
        }, {});

        const paginatedProducts = results.slice(startIndex, endIndex);

        // Replace product_cat_id with extra_cat_name using the lookup object
        paginatedProducts.forEach((product) => {
          if (extraCatLookup.hasOwnProperty(product.product_cat_id)) {
            product.product_cat_id = extraCatLookup[product.product_cat_id];
          }
        });

        const totalPages = Math.ceil(results.length / itemsPerPage);

        res.json({
          currentPage: currentPage,
          totalPages: totalPages,
          products: paginatedProducts,
          totalProducts: results.length,
          images: images,
          users,
        });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getBrandedProducts = async (req, res) => {
  try {
    page = req.cookies.__pB || 1;

    const [mainCat, subCat, extraCat, allCat, images, tempImages] =
      await Promise.all([
        catModel.fetchMainCat(),
        catModel.fetchSubCat(),
        catModel.fetchExtraCat(),
        catModel.fetchAllCat(),
        catModel.fetchFeaturedImages(),
        catModel.fetchFeaturedTempImages(),
      ]);
    try {
      const currentPage = parseInt(req.query.page) || page;
      // update the page cookie
      res.cookie(
        "__pB",
        currentPage,
        { path: "/" },
        { maxAge: 2 * 60 * 60 * 1000 }
      );

      const itemsPerPage = 10;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const searchTerm = req.query.search || "";

      var query = `SELECT * FROM product_template`;

      if (searchTerm) {
        query += ` WHERE temp_name LIKE '%${searchTerm}%'`;
      }
      query += ` ORDER BY temp_id DESC`;

      db.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        const extraCatLookup = extraCat.reduce((lookup, cat) => {
          lookup[cat.extra_cat_id] = cat.extra_cat_name;
          return lookup;
        }, {});

        const paginatedProducts = results.slice(startIndex, endIndex);

        // Replace product_cat_id with extra_cat_name using the lookup object
        paginatedProducts.forEach((product) => {
          if (extraCatLookup.hasOwnProperty(product.extra_cat_id)) {
            product.extra_cat_id = extraCatLookup[product.extra_cat_id];
          }
        });

        const totalPages = Math.ceil(results.length / itemsPerPage);
        // console.log(paginatedProducts)
        // console.log(tempImages)
        res.json({
          currentPage: currentPage,
          totalPages: totalPages,
          products: paginatedProducts,
          totalProducts: results.length,
          images: tempImages,
        });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.delBrandedProducts = (req, res) => {
  const tempId = req.params.id;
  const page = req.cookies.__pB || 1;

  db.query(
    `SELECT * FROM product_temp_video WHERE temp_id = ?`,
    [tempId],
    (err1, videoResults) => {
      if (err1 && videoResults != undefined) {
        return res.send(err1);
      }

      if (videoResults != undefined) {
        db.query(
          `DELETE FROM product_temp_video WHERE temp_id = ?`,
          [tempId],
          (err2, res2) => {
            if (err2) {
              return res.send(err2);
            }
            deleteImagesAndProduct(tempId);
          }
        );
      } else {
        deleteImagesAndProduct(tempId);
      }
    }
  );

  function deleteImagesAndProduct(tempId) {
    db.query(
      `DELETE FROM product_temp_images WHERE product_temp_id = ?`,
      [tempId],
      (err3, res3) => {
        if (err3) {
          return res.send(err3);
        }

        db.query(
          `DELETE FROM product_template WHERE temp_id = ?`,
          [tempId],
          (err4, res4) => {
            if (err4) {
              return res.send(err4);
            }
            return res.redirect("/branded/?page=" + page);
          }
        );
      }
    );
  }
};

exports.productStat = (req, res) => {
  const { product_id, status } = req.body;
  const page = req.cookies.__p || 1;

  // console.log("Product Stat: ", product_id, status)
  db.query(
    "UPDATE `products` SET `status` = ? WHERE `products`.`product_id` = ?",
    [status, product_id],
    (err1, res1) => {
      if (!err1) {
        res.redirect("/?page=" + page);
      } else {
        res.send(err1);
      }
    }
  );
};

exports.productVis = (req, res) => {
  const { pId, currentVis } = req.params;
  const page = req.cookies.__p || 1;

  db.query(
    "UPDATE `products` SET `admin_published` = ? WHERE `products`.`product_id` = ?",
    [currentVis == 1 ? 0 : 1, pId],
    (err1, res1) => {
      if (!err1) {
        res.redirect("/?page=" + page);
      } else {
        res.send(err1);
      }
    }
  );
};

exports.productFilter = (req, res) => {
  const { filter } = req.params;
  res.clearCookie("__pB", { path: "/" });
  res.clearCookie("__p", { path: "/" });
  res.clearCookie("filter", { path: "/" });
  res.cookie("filter", filter, { maxAge: 2 * 60 * 60 * 1000 });
  res.redirect("/");
};
