const express = require("express");
const { login, loginPost, logout } = require("../controllers/login.controller");
const router = express.Router();

router.get("/login", login);
router.post("/login", loginPost);
router.get("/logout", logout);

module.exports = router;
