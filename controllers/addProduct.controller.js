const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const mult_upload = require("../config/multer_product.config");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

exports.addProduct = async (req, res) => {
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
    return res.render("addProduct", {
      extraCat: extraCat,
      subCat: subCat,
      mainCat: mainCat,
      premissions,
      admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

// exports.addProductPost = (req, res) => {
//   mult_upload.fields([
//     { name: "productImages", maxCount: 10 },
//     { name: "product_des", maxCount: 1 },
//     { name: "product_video", maxCount: 1 },
//   ])(req, res, function (error) {
//     if (error) {
//       console.error("Error uploading files:", error);
//       return res.status(500).send("Error uploading files");
//     }
//     const {
//       product_name,
//       product_price,
//       extra_cat,
//       product_des,
//       product_short_des,
//       featured_index,
//     } = req.body;

//     const productImages = req.files["productImages"];

//     let picUrls;
//     if (Array.isArray(productImages)) {
//       picUrls = productImages.map(
//         (file) => "https://admin.save71.com/images/products/" + file.filename
//       );
//     } else {
//       picUrls = [];
//     }

//     const featured_image_index = parseInt(featured_index);

//     // Insert product information into the database
//     const productQuery =
//       "INSERT INTO `product_template` (`temp_id`, `temp_name`, `temp_price`, `temp_short_des`, `temp_long_des`, `extra_cat_id`) VALUES (NULL, ?, ?, ?, ?, ?)";
//     var video_url = req.files["product_video"]
//       ? "https://admin.save71.com/images/products/" +
//         req.files["product_video"][0].filename
//       : null;
//     db.query(
//       productQuery,
//       [product_name, product_price, product_short_des, product_des, extra_cat],
//       function (err, productResult) {
//         if (err) {
//           console.log("Database query error:", err);
//           return res.status(500).send("Error: " + err.message);
//         }

//         // Inserted product successfully, retrieve the product ID
//         const product_id = productResult.insertId;
//         console.log("PID : ", featured_image_index, featured_index);

//         // Insert image URLs into the database
//         if (picUrls.length > 0) {
//           const imageQuery =
//             "INSERT INTO `product_temp_images` (id, product_temp_id, temp_image_url, featured_image) VALUES ?";
//           const imageValues = picUrls.map((picUrl, index) => [
//             null,
//             product_id,
//             picUrl,
//             index === featured_image_index ? 1 : 0,
//           ]);

//           db.query(imageQuery, [imageValues], function (err, imageResult) {
//             if (err) {
//               console.log("Database query error:", err);
//               return res.status(500).send("Error: " + err.message);
//             }

//             // Images inserted successfully
//             console.log("Product and images saved successfully");
//             //   res.status(200).json({ message: "Product and images saved successfully" });
//             res.redirect("back");
//           });
//         } else {
//           // No images uploaded, send success message
//           console.log("Product saved successfully");
//           res.status(200).json({ message: "Product saved successfully" });
//         }

//         const directoryPath = path.join(__dirname, "../public/images/products");
//         // Call the function
//         convertAndDelete(directoryPath)
//           .then(() => console.log("Images converted successfully"))
//           .catch((err) => console.error("Error during conversion:", err));

//         if (video_url) {
//           var videoQuery =
//             "INSERT INTO `product_temp_video` (`id`, `product_temp_id`, `temp_video_url`) VALUES (NULL, ?, ?)";
//           db.query(videoQuery, [product_id, video_url], function (err, result) {
//             if (err) {
//               console.log("Database query error:", err);
//             }
//           });
//         }
//       }
//     );
//   });
// };

exports.addProductPost = (req, res) => {
  function stripHtmlTags(text) {
    return text
      .replace(/<\/p>/g, "\n\n") // Replace </p> with two newlines for paragraph separation
      .replace(/<br\s*\/?>/g, "\n") // Replace <br> with single newlines
      .replace(/<[^>]+>/g, ""); // Remove other HTML tags
  }
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

    // Strip HTML tags from product descriptions
    const productDesPlain = stripHtmlTags(product_des);
    const productShortDesPlain = stripHtmlTags(product_short_des);

    const productImages = req.files["productImages"];

    let picUrls;
    if (Array.isArray(productImages)) {
      picUrls = productImages.map(
        (file) => "https://admin.save71.com/images/products/" + file.filename
      );
    } else {
      picUrls = [];
    }

    const featured_image_index = parseInt(featured_index);

    // Insert product information into the database
    const productQuery =
      "INSERT INTO `product_template` (`temp_id`, `temp_name`, `temp_price`, `temp_short_des`, `temp_long_des`, `extra_cat_id`) VALUES (NULL, ?, ?, ?, ?, ?)";
    var video_url = req.files["product_video"]
      ? "https://admin.save71.com/images/products/" +
        req.files["product_video"][0].filename
      : null;
    db.query(
      productQuery,
      [
        product_name,
        product_price,
        productShortDesPlain,
        productDesPlain,
        extra_cat,
      ],
      function (err, productResult) {
        if (err) {
          console.log("Database query error:", err);
          return res.status(500).send("Error: " + err.message);
        }

        const product_id = productResult.insertId;

        if (picUrls.length > 0) {
          const imageQuery =
            "INSERT INTO `product_temp_images` (id, product_temp_id, temp_image_url, featured_image) VALUES ?";
          const imageValues = picUrls.map((picUrl, index) => [
            null,
            product_id,
            picUrl,
            index === featured_image_index ? 1 : 0,
          ]);

          db.query(imageQuery, [imageValues], function (err, imageResult) {
            if (err) {
              console.log("Database query error:", err);
              return res.status(500).send("Error: " + err.message);
            }
            res.redirect("back");
          });
        } else {
          res.status(200).json({ message: "Product saved successfully" });
        }

        const directoryPath = path.join(__dirname, "../public/images/products");
        convertAndDelete(directoryPath)
          .then(() => console.log("Images converted successfully"))
          .catch((err) => console.error("Error during conversion:", err));

        if (video_url) {
          var videoQuery =
            "INSERT INTO `product_temp_video` (`id`, `product_temp_id`, `temp_video_url`) VALUES (NULL, ?, ?)";
          db.query(videoQuery, [product_id, video_url], function (err, result) {
            if (err) {
              console.log("Database query error:", err);
            }
          });
        }
      }
    );
  });
};
