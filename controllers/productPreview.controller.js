const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const mult_upload = require("../config/multer_preview.config");
const fs = require("fs-extra");

exports.productPreview = async (req, res) => {
  try {
    const [mainCat, subCat, extraCat, allCat, images] = await Promise.all([
      catModel.fetchMainCat(),
      catModel.fetchSubCat(),
      catModel.fetchExtraCat(),
      catModel.fetchAllCat(),
      catModel.fetchFeaturedImages(),
    ]);
    mult_upload.fields([
      { name: "productImages", maxCount: 10 },
      { name: "product_des", maxCount: 1 },
      { name: "product_video", maxCount: 1 },
    ])(req, res, function (error) {
      if (error) {
        console.error("Error uploading files:", error);
        return res.status(500).send("Error uploading files");
      }

      // Update the values of req.body with the corresponding names
      const mainCatMatch = mainCat.find(
        (cat) => cat.main_cat_id === req.body.main_cat
      );
      const subCatMatch = subCat.find(
        (cat) => cat.sub_cat_id === req.body.sub_cat
      );
      const extraCatMatch = extraCat.find(
        (cat) => cat.extra_cat_id === req.body.extra_cat
      );

      if (mainCatMatch) {
        req.body.main_cat = mainCatMatch.main_cat_name;
      }
      if (subCatMatch) {
        req.body.sub_cat = subCatMatch.sub_cat_name;
      }
      if (extraCatMatch) {
        req.body.extra_cat = extraCatMatch.extra_cat_name;
      }

      const productImages = req.files["productImages"];

      let picUrls;
      if (Array.isArray(productImages)) {
        picUrls = productImages.map(
          (file) => "https://admin.save71.com/images/preview/" + file.filename
        );
      } else {
        picUrls = [];
      }

      var video_url = req.files["product_video"]
        ? "https://admin.save71.com/images/preview/" +
          req.files["product_video"][0].filename
        : null;
      res.status(200).json({
        previewInfo: req.body,
        previewImages: picUrls,
        previewVideo: video_url,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.previewDelete = async (req, res) => {
  const directoryPath = "./public/images/preview";
  fs.emptyDir(directoryPath, (error) => {
    if (error) {
      console.error("Error removing directory contents:", error);
    } else {
      console.log("Directory contents removed successfully:", directoryPath);
    }
  });
};
