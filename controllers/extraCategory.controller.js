const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const mult_upload = require("../config/multer_category.config");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

exports.extraCategory = async (req, res) => {
  try {
    const adminInfo = JSON.parse(
      crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
    );
    if (!adminInfo || !adminInfo.is_logged) {
      if (adminInfo.otp !== true) {
        console.log("OTP not verified");
        return res.redirect("/otp");
      } else {
        console.log("Admin not logged in");
        return res.redirect("/login");
      }
    }

    const admin = await adminModel.getAdminById(res, req, adminInfo.admin_id);
    const premissions = await adminModel.getAdminPremissions(
      admin.is_super_admin,
      admin.permissions
    );
    const [mainCat, subCat, extraCat, allCat, allProducts, images] =
      await Promise.all([
        catModel.fetchMainCat(),
        catModel.fetchSubCat(),
        catModel.fetchExtraCat(),
        catModel.fetchAllCat(),
        catModel.fetchAllProducts(),
        catModel.fetchFeaturedImages(),
      ]);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * 10;
    db.query(
      "SELECT * FROM `extra_cat` LIMIT 10 OFFSET ?",
      [offset],
      (err1, res1) => {
        if (err1) {
          console.error(err1);
          return res.status(500).send("Internal Server Error");
        }
        return res.render("extraCategory", {
          products: res1,
          subCat,
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

exports.getExtraProducts = async (req, res) => {
  try {
    const [mainCat, subCat, extraCat, allCat, allProducts, images] =
      await Promise.all([
        catModel.fetchMainCat(),
        catModel.fetchSubCat(),
        catModel.fetchExtraCat(),
        catModel.fetchAllCat(),
        catModel.fetchAllProducts(),
        catModel.fetchFeaturedImages(),
      ]);
    try {
      const currentPage = parseInt(req.params.page) || 1;
      const itemsPerPage = 10;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      const searchTerm = req.query.search || "";
      console.log("Ajax executed");

      var query = `SELECT * FROM extra_cat`;

      if (searchTerm) {
        query += ` WHERE extra_cat_name LIKE '%${searchTerm}%'`;
      }

      db.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        const paginatedProducts = results.slice(startIndex, endIndex);

        //  sub cat ref name added
        const subCatLookup = {};
        subCat.forEach((cat) => {
          subCatLookup[cat.sub_cat_id] = cat.sub_cat_name;
        });
        paginatedProducts.forEach((product) => {
          const subCatId = product.extra_cat_ref;
          if (subCatLookup.hasOwnProperty(subCatId)) {
            product.extra_cat_ref = subCatLookup[subCatId];
          }
        });

        const counts = extraCat.map((extraItem) => {
          const matchingProducts = allProducts.filter(
            (product) => product.product_cat_id === extraItem.extra_cat_id
          );
          return matchingProducts.length;
        });

        paginatedProducts.forEach((product) => {
          const extraCatId = product.extra_cat_id;
          const countIndex = extraCat.findIndex(
            (extraItem) => extraItem.extra_cat_id === extraCatId
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
          subCat: subCat,
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

exports.addExtraCategory = async (req, res) => {
  mult_upload.single("extra_cat_image")(req, res, (err) => {
    if (err) {
      console.error("Error occurred while uploading image:", err);
      return;
    }
    const {
      category_name,
      sub_cat_ref,
      retailer_deduct_percentage,
      manufacturer_deduct_percentage,
    } = req.body;
    // console.log(category_name, sub_cat_ref, retailer_deduct_percentage, manufacturer_deduct_percentage)

    // File upload successful
    const imageFileName =
      "https://admin.save71.com/images/categories/" + req.file.filename;
    console.log("Image uploaded successfully:", imageFileName);
    db.query(
      "INSERT INTO `extra_cat` (`id`, `extra_cat_id`, `extra_cat_ref`, `extra_cat_name`, `extra_cat_image_url`, `popular_cat_value`, `retailer_deduct_percentage`, `manufacturer_deduct_percentage`) VALUES (NULL, ?, ?, ?, ?, NULL, ?, ?)",
      [
        0,
        sub_cat_ref,
        category_name,
        imageFileName,
        retailer_deduct_percentage,
        manufacturer_deduct_percentage,
      ],
      (err, result) => {
        if (!err) {
          console.error("Error occurred while adding sub category:", err);
          const id = result.insertId;
          console.log("ID : ", id);
          db.query(
            "UPDATE `extra_cat` SET `extra_cat_id` = ? WHERE `extra_cat`.`id` = ?",
            ["extracat-" + id, id],
            (err2, res2) => {
              if (!err2) {
                res.redirect("/extracategory");
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

exports.extraCatDel = async (req, res) => {
  const id = req.params.id;
  console.log("ID : ", id);
  db.query(
    `DELETE FROM extra_cat
  WHERE extra_cat.id = ?`,
    [id],
    (err1, res1) => {
      if (!err1) {
        res.redirect("/extracategory");
      } else {
        res.send(err1);
      }
    }
  );
};

exports.extraCatEdit = (req, res) => {
  mult_upload.single("productImage")(req, res, (err) => {
    if (err) {
      console.error("Error occurred while uploading image:", err);
      return;
    }

    const id = req.params.id;
    const { category_name, category_ref, deductAmount, deductManuAmount } =
      req.body;
    let imageFileName = "";
    if (req.file) {
      imageFileName =
        "https://admin.save71.com/images/categories/" + req.file.filename;
      db.query(
        "UPDATE `extra_cat` SET `extra_cat_ref` = ?, `extra_cat_name` = ?, `extra_cat_image_url` = ?, `retailer_deduct_percentage` = ?, `manufacturer_deduct_percentage` = ? WHERE `extra_cat`.`id` = ?",
        [
          category_ref,
          category_name,
          imageFileName,
          deductAmount,
          deductManuAmount,
          id,
        ],
        (err1, res11) => {
          if (!err1) {
            res.redirect("/extracategory");
          } else {
            res.send(err1);
          }
        }
      );
    } else {
      db.query(
        "UPDATE `extra_cat` SET `extra_cat_ref` = ?, `extra_cat_name` = ?, `retailer_deduct_percentage` = ? WHERE `extra_cat`.`id` = ?",
        [category_ref, category_name, deductAmount, id],
        (err1, res11) => {
          if (!err1) {
            res.redirect("/extracategory");
          } else {
            res.send(err1);
          }
        }
      );
    }
    const directoryPath = path.join(__dirname, "../public/images/categories");
    // Call the function
    convertAndDelete(directoryPath)
      .then(() => console.log("Images converted successfully"))
      .catch((err) => console.error("Error during conversion:", err));
  });
};
