const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const Router = require("./routes/allRouters");
const crypto = require("./middlewares/crypto");
const { validateAdmin, checkPermissions } = require("./middlewares/auth");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

app.use(async (req, res, next) => {
  if (req.path === "/login") {
    return next();
  }

  try {
    const decryptedData = crypto.decrypt(req.cookies.__aD || "");
    // Ensure the decrypted data is a valid JSON string or use a fallback
    const adminData = JSON.parse(decryptedData || '{"is_logged": false}');
    if (!adminData.is_logged) {
      console.log("Admin not logged in");
      return res.redirect("/login");
    }

    const admin_id = adminData.admin_id;
    await checkPermissions(req, res, next, admin_id);
  } catch (err) {
    console.error("Failed to parse admin data:", err);
    return res.redirect("/login");
  }
});

app.use(Router);

// static files
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/images", express.static(__dirname + "public/images"));
app.use("/js", express.static(__dirname + "public/js"));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

const port = 3010;
app.listen(port, function () {
  console.log("Listening on port " + port);
});
