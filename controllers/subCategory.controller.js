const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const mult_upload = require("../config/multer_category.config");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

exports.subCategory = async (req, res) => {
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
    const [mainCat, subCat, extraCat, allCat, images] = await Promise.all([
      catModel.fetchMainCat(),
      catModel.fetchSubCat(),
      catModel.fetchExtraCat(),
      catModel.fetchAllCat(),
      catModel.fetchFeaturedImages(),
    ]);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * 10;
    db.query(
      "SELECT * FROM `sub_cat` LIMIT 10 OFFSET ?",
      [offset],
      (err1, res1) => {
        if (err1) {
          console.error(err1);
          return res.status(500).send("Internal Server Error");
        }
        return res.render("subCategory", {
          subCat: res1,
          mainCat,
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

exports.getSubProducts = async (req, res) => {
  try {
    const [mainCat, subCat, extraCat, allCat, images] = await Promise.all([
      catModel.fetchMainCat(),
      catModel.fetchSubCat(),
      catModel.fetchExtraCat(),
      catModel.fetchAllCat(),
      catModel.fetchFeaturedImages(),
    ]);
    try {
      const currentPage = parseInt(req.params.page) || 1;
      const itemsPerPage = 10;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const searchTerm = req.query.search || "";

      var query = `SELECT * FROM sub_cat`;

      if (searchTerm) {
        query += ` WHERE sub_cat_name LIKE '%${searchTerm}%'`;
      }

      db.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        const paginatedProducts = results.slice(startIndex, endIndex);

        //  main cat ref name added
        const mainCatLookup = {};
        mainCat.forEach((cat) => {
          mainCatLookup[cat.main_cat_id] = cat.main_cat_name;
        });
        paginatedProducts.forEach((product) => {
          const mainCatId = product.sub_cat_ref;
          if (mainCatLookup.hasOwnProperty(mainCatId)) {
            product.main_cat_ref = mainCatLookup[mainCatId];
          }
        });

        const counts = results.map((item) => {
          const matchingExtraCats = extraCat.filter(
            (extraItem) => extraItem.extra_cat_ref === item.sub_cat_id
          );
          return matchingExtraCats.length;
        });
        paginatedProducts.forEach((product) => {
          const subCatId = product.sub_cat_id;
          const countIndex = results.findIndex(
            (item) => item.sub_cat_id === subCatId
          );
          if (countIndex !== -1) {
            product.count = counts[countIndex];
          }
        });

        const totalProducts = paginatedProducts.length;
        const totalPages = Math.ceil(results.length / itemsPerPage);
        // console.log("Filters:", paginatedProducts)
        res.json({
          currentPage: currentPage,
          totalPages: totalPages,
          products: paginatedProducts,
          totalProducts: totalProducts,
          images: images,
          ExtraCatCount: counts,
          mainCat: mainCat,
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

exports.subCatAdd = async (req, res) => {
  mult_upload.single("sub_cat_image")(req, res, (err) => {
    if (err) {
      console.error("Error occurred while uploading image:", err);
      return;
    }
    const { category_name, main_cat_ref } = req.body;

    // File upload successful
    const imageFileName =
      "https://admin.saveneed.com/images/categories/" + req.file.filename;

    db.query(
      "INSERT INTO `sub_cat` (`id`, `sub_cat_id`, `sub_cat_ref`, `sub_cat_name`, `sub_cat_image_url`, `popular_cat_value`) VALUES (NULL, ?, ?, ?, ?, NULL)",
      [0, main_cat_ref, category_name, imageFileName],
      (err, result) => {
        if (!err) {
          console.error("Error occurred while adding sub category:", err);
          const id = result.insertId;
          console.log("ID : ", id);
          db.query(
            "UPDATE `sub_cat` SET `sub_cat_id` = ? WHERE `sub_cat`.`id` = ?",
            ["subcat-" + id, id],
            (err2, res2) => {
              if (!err2) {
                res.redirect("/subcategory");
                const directoryPath = path.join(
                  __dirname,
                  "../public/images/categories"
                );
                // Call the function
                convertAndDelete(directoryPath)
                  .then(() => console.log("Images converted successfully"))
                  .catch((err) =>
                    console.error("Error during conversion:", err)
                  );
              } else {
                res.send(err2);
              }
            }
          );
        } else {
          console.log(err);
          res.send(err);
        }
      }
    );
  });
};

exports.subCatDel = async (req, res) => {
  const subCatId = req.params.id;
  db.query(
    `DELETE FROM extra_cat
  WHERE extra_cat.extra_cat_ref IN (
    SELECT sub_cat.sub_cat_id
    FROM sub_cat
    WHERE sub_cat.id = ?
  )`,
    [subCatId],
    (err1, res1) => {
      if (!err1) {
        db.query(
          `DELETE FROM sub_cat
        WHERE sub_cat.id = ?`,
          [subCatId],
          (err2, res2) => {
            if (!err2) {
              res.redirect("/subcategory");
            } else {
              res.send(err2);
            }
          }
        );
      } else {
        res.send(err1);
      }
    }
  );
};

exports.subCatEdit = (req, res) => {
  mult_upload.single("productImage")(req, res, (err) => {
    if (err) {
      console.error("Error occurred while uploading image:", err);
      return;
    }

    const id = req.params.id;
    const { category_name, category_ref } = req.body;
    let imageFileName = "";
    if (req.file) {
      imageFileName =
        "https://admin.saveneed.com/images/categories/" + req.file.filename;
      db.query(
        "UPDATE `sub_cat` SET `sub_cat_ref` = ?, `sub_cat_name` = ?, `sub_cat_image_url` = ? WHERE `sub_cat`.`id` = ?",
        [category_ref, category_name, imageFileName, id],
        (err1, res11) => {
          if (!err1) {
            res.redirect("/subcategory");
          } else {
            res.send(err1);
          }
        }
      );
    } else {
      db.query(
        "UPDATE `sub_cat` SET `sub_cat_ref` = ?, `sub_cat_name` = ? WHERE `sub_cat`.`id` = ?",
        [category_ref, category_name, id],
        (err1, res11) => {
          if (!err1) {
            res.redirect("/subcategory");
          } else {
            res.send(err1);
          }
        }
      );
    }
  });
};
