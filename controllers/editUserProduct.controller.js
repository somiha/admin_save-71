const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const adminModel = require("../middlewares/admin");
const crypto = require("../middlewares/crypto");
const mult_upload = require("../config/multer_product.config");

exports.editProduct = async (req, res) => {
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
    const [mainCat, subCat, extraCat, allCat, images, video] =
      await Promise.all([
        catModel.fetchMainCat(),
        catModel.fetchSubCat(),
        catModel.fetchExtraCat(),
        catModel.fetchAllCat(),
        catModel.fetchAllImages(),
        catModel.fetchAllVideos(),
      ]);

    const { pID } = req.params;

    db.query(
      "SELECT * FROM `products` WHERE `product_id` = ?",
      [pID],
      (err1, res1) => {
        if (!err1) {
          const product = res1[0];
          const extraCatIndex = extraCat.findIndex(
            (cat) => cat.extra_cat_id === product.product_cat_id
          );
          if (extraCatIndex !== -1) {
            const extraCategory = extraCat[extraCatIndex];
            const subCatIndex = subCat.findIndex(
              (cat) => cat.sub_cat_id === extraCategory.extra_cat_ref
            );
            if (subCatIndex !== -1) {
              const subCategory = subCat[subCatIndex];
              const mainCatIndex = mainCat.findIndex(
                (cat) => cat.main_cat_id === subCategory.sub_cat_ref
              );
              if (mainCatIndex !== -1) {
                const mainCategory = mainCat[mainCatIndex];
                // console.log(res1[0])
                return res.render("editUserProduct", {
                  extraCatIndex,
                  subCatIndex,
                  mainCatIndex,
                  mainCat,
                  subCat,
                  extraCat,
                  images,
                  product: res1[0],
                  pID,
                  video,
                  premissions,
                  admin,
                });
              } else {
                res.status(500).send("Main Category not found");
              }
            } else {
              res.status(500).send("Sub Category not found");
            }
          } else {
            res.status(500).send("Extra Category not found");
          }
        } else {
          console.error(err1);
          res.status(500).send("Error While fetching templates !");
        }
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.editProductPost = (req, res) => {
  mult_upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "product_des", maxCount: 1 },
    { name: "product_video", maxCount: 1 },
  ])(req, res, function (error) {
    if (error) {
      console.error("Error uploading files:", error);
      return res.status(500).send("Error uploading files");
    }
    const {
      product_name,
      product_price,
      extra_cat,
      product_des,
      product_short_des,
      featured_index,
    } = req.body;

    const productImages = req.files["productImages"];
    const { pID } = req.params;
    const page = req.cookies.__p || 1;

    let picUrls;
    if (Array.isArray(productImages)) {
      picUrls = productImages.map(
        (file) => "https://admin.saveneed.com/images/products/" + file.filename
      );
    } else {
      picUrls = [];
    }

    const featured_image_index = parseInt(featured_index);

    // Insert product information into the database
    const productQuery =
      "UPDATE `products` SET `product_name` = ?, `product_price` = ?, `product_short_des` = ?, `product_details_des` = ?, `product_cat_id` = ? WHERE `product_id` = ?";
    var video_url = req.files["product_video"]
      ? "https://admin.saveneed.com/images/products/" +
        req.files["product_video"][0].filename
      : null;
    db.query(
      productQuery,
      [
        product_name,
        product_price,
        product_short_des,
        product_des,
        extra_cat,
        pID,
      ],
      function (err, productResult) {
        if (err) {
          console.log("Database query error:", err);
          return res.status(500).send("Error: " + err.message);
        }

        // Insert image URLs into the database
        if (picUrls.length > 0) {
          // Prev image deleting
          db.query(
            "DELETE FROM `product_image` WHERE `product_image`.`product_id` = ?",
            [pID],
            (errDelImg, resDelImg) => {
              if (!errDelImg) {
                // Uploading new Images
                const imageQuery =
                  "INSERT INTO `product_image` (id, product_id, product_image_url, featured_image) VALUES ?";
                const imageValues = picUrls.map((picUrl, index) => [
                  null,
                  pID,
                  picUrl,
                  index === featured_image_index ? 1 : 0,
                ]);

                db.query(
                  imageQuery,
                  [imageValues],
                  function (err, imageResult) {
                    if (err) {
                      console.log("Database query error:", err);
                      return res.status(500).send("Error: " + err.message);
                    }
                    // Images inserted successfully

                    //   res.status(200).json({ message: "Product and images saved successfully" });
                    res.redirect("/?&page=" + page);
                  }
                );
              } else {
                console.log("Database query error:", errDelImg);
                return res.status(500).send("Error: " + errDelImg.message);
              }
            }
          );
        } else {
          // No images uploaded, send success message

          res.status(200).redirect("/?&page=" + page);
        }

        // Convert images to WebP format and delete originals
        const directoryPath = path.join(__dirname, "../public/images/products");

        // Call the function
        convertAndDelete(directoryPath)
          .then(() => console.log("Images converted successfully"))
          .catch((err) => console.error("Error during conversion:", err));

        //  video upload section
        if (video_url) {
          // deleting previous videos
          db.query(
            "DELETE FROM `product_video` WHERE `product_video`.`product_id` = ?",
            [pID],
            (errDelVid, resDelVid) => {
              if (errDelVid) {
                console.log("Database query error:", errDelVid);
                return res.status(500).send("Error: " + errDelVid.message);
              }
            }
          );

          // Inserting New videos
          var videoQuery =
            "INSERT INTO `product_video` (`id`, `product_id`, `product_video_url`) VALUES (NULL, ?, ?)";
          db.query(videoQuery, [pID, video_url], function (err, result) {
            if (err) {
              console.log("Database query error:", err);
              return;
            }
          });
        }
      }
    );
  });
};

exports.delImage = (req, res) => {
  const { pID } = req.params;
  db.query(
    "DELETE FROM `product_image` WHERE `product_image`.`id` = ?",
    [pID],
    (err1, res1) => {
      if (!err1) {
        res.redirect("back");
      } else {
        console.log("Database query error:", err1);
        return res.status(500).send("Error: " + err1.message);
      }
    }
  );
};
exports.delVideo = (req, res) => {
  const { pID } = req.params;
  db.query(
    "DELETE FROM `product_video` WHERE `product_video`.`id` = ?",
    [pID],
    (err1, res1) => {
      if (!err1) {
        res.redirect("back");
      } else {
        console.log("Database query error:", err1);
        return res.status(500).send("Error: " + err1.message);
      }
    }
  );
};
