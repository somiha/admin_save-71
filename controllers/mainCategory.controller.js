const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

exports.mainCategory = async (req, res) => {
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
      "SELECT * FROM `main_cat` LIMIT 10 OFFSET ?",
      [offset],
      (err1, res1) => {
        if (err1) {
          console.error(err1);
          return res.status(500).send("Internal Server Error");
        }

        return res.render("mainCategory", {
          mainCat: res1,
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

exports.getMainProducts = async (req, res) => {
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
      // console.log(currentPage, startIndex, endIndex);

      const searchTerm = req.query.search || "";

      var query = `SELECT * FROM main_cat`;

      if (searchTerm) {
        query += ` WHERE main_cat_name LIKE '%${searchTerm}%'`;
      }

      db.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        const paginatedProducts = results.slice(startIndex, endIndex);
        // Assuming you have 'result' and 'subCat' arrays

        const counts = results.map((item) => {
          const matchingSubCats = subCat.filter(
            (subItem) => subItem.sub_cat_ref === item.main_cat_id
          );
          return matchingSubCats.length;
        });

        const totalProducts = paginatedProducts.length;
        const totalPages = Math.ceil(results.length / itemsPerPage);
        res.json({
          currentPage: currentPage,
          totalPages: totalPages,
          products: paginatedProducts,
          totalProducts: totalProducts,
          images: images,
          subCatCount: counts,
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

exports.mainCatAdd = async (req, res) => {
  const name = req.body.main_category_name;
  db.query(
    "INSERT INTO `main_cat` (`id`, `main_cat_id`, `main_cat_name`, `main_cat_image_url`, `popular_cat_value`) VALUES (NULL, ?, ?, NULL, NULL)",
    [0, name],
    (err1, res1) => {
      if (!err1) {
        const mainCatId = "maincat-" + res1.insertId;
        db.query(
          "UPDATE `main_cat` SET `main_cat_id` = ? WHERE `main_cat`.`id` = ?",
          [mainCatId, res1.insertId],
          (err2, res2) => {
            if (!err2) {
              res.redirect("/maincategory");
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

exports.mainCatDel = async (req, res) => {
  const id = req.params.id;
  console.log("ID : ", id);
  db.query(
    `DELETE FROM extra_cat
  WHERE extra_cat.extra_cat_ref IN (
    SELECT sub_cat.sub_cat_id
    FROM sub_cat
    WHERE sub_cat.sub_cat_ref IN (
      SELECT main_cat.main_cat_id
      FROM main_cat
      WHERE main_cat.id = ?
    )
  )`,
    [id],
    (err1, res1) => {
      if (!err1) {
        db.query(
          `DELETE FROM sub_cat
        WHERE sub_cat.sub_cat_ref IN (
          SELECT main_cat.main_cat_id
          FROM main_cat
          WHERE main_cat.id = ?
        )`,
          [id],
          (err2, res2) => {
            if (!err2) {
              db.query(
                `DELETE FROM main_cat
            WHERE main_cat.id = ?`,
                [id],
                (err3, res3) => {
                  if (!err3) {
                    res.redirect("/maincategory");
                  } else {
                    res.send(err3);
                  }
                }
              );
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

exports.mainCatEdit = (req, res) => {
  const id = req.params.id;
  const { main_category_name } = req.body;
  db.query(
    "UPDATE `main_cat` SET `main_cat_name` = ? WHERE `main_cat`.`id` = ?",
    [main_category_name, id],
    (err1, res1) => {
      if (!err1) {
        res.redirect("/maincategory");
      } else {
        res.send(err1);
      }
    }
  );
};
