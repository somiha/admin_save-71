const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

exports.withDrawRequest = async (req, res) => {
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

    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const query = `
			SELECT * FROM shop_transaction
			INNER JOIN  shop  ON shop.id  =  shop_transaction.shop_id
			INNER JOIN  user  ON  user.user_id  =  shop.seller_user_id
			INNER JOIN  use_bank_info  ON  user.user_id  =  use_bank_info.user_id
      WHERE shop_transaction.is_withdraw = 1
			ORDER BY  shop_transaction.transaction_id  DESC;
		`;

    const actions = ["⚠️ Pending", "♻️ Processing", "✅ Paid", "❌ Rejected"];

    db.query(query, (err1, res1) => {
      if (err1) {
        console.error(err1);
        return res.status(500).send("Internal Server Error");
      }

      const paginatedWithdraw = res1.slice(startIndex, endIndex);
      const totalPages = Math.ceil(res1.length / itemsPerPage);

      // console.log(paginatedWithdraw);

      return res.render("withdrawRequest", {
        withdraw: paginatedWithdraw,
        currentPage: currentPage,
        totalPages: totalPages,
        actions: actions,
        admin,
        premissions,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getWithDrawRequest = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const searchTerm = req.query.search || "";
    const sDate = req.cookies.sDate == 0 ? "" : req.cookies.sDate;
    const eDate = req.cookies.eDate == 0 ? "" : req.cookies.eDate;
    const phn = req.cookies.phn == 0 ? "" : req.cookies.phn;
    const countryName = req.cookies.__ctrN == 0 ? "" : req.cookies.__ctrN;
    const status = parseInt(req.query.status) || 0;

    const actions = ["⚠️ Pending", "♻️ Processing", "✅ Paid", "❌ Rejected"];

    let query =
      "SELECT * FROM `shop_transaction` " +
      "INNER JOIN `shop` ON `shop`.`id` = `shop_transaction`.`shop_id` " +
      "INNER JOIN `user` ON `user`.`user_id` = `shop`.`seller_user_id` " +
      "INNER JOIN `use_bank_info` ON `user`.`user_id` = `use_bank_info`.`user_id`" +
      " WHERE `shop_transaction`.`is_withdraw` = 1";

    query += " AND `shop_transaction`.`status` = " + status;
    if (searchTerm) {
      query += " AND `shop_transaction`.`transaction_id` LIKE " + searchTerm;
    }
    if (sDate && eDate) {
      query +=
        " AND `shop_transaction`.`date` BETWEEN '" +
        sDate +
        "' AND '" +
        eDate +
        "'";
    }
    if (phn) {
      query += " AND `user`.`phone` LIKE '" + phn + "%'";
    }

    query += " ORDER BY `shop_transaction`.`transaction_id` ASC";

    const [curr] = await Promise.all([
      catModel.fetchCurrencyRate(countryName || "US"),
    ]);

    const currCode = curr.at(1);
    const currRate = curr.at(0);

    // console.log(curr, currCode, currRate);

    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }
      results.forEach((result) => {
        result.user_password = undefined;
      });

      const paginatedWithdraw = results.slice(startIndex, endIndex);
      const totalPages = Math.ceil(results.length / itemsPerPage);

      res.json({
        currentPage: currentPage,
        totalPages: totalPages,
        withdraws: paginatedWithdraw,
        totalProducts: results.length,
        actions: actions,
        totalItems: results.length,
        currCode,
        currRate,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.withDrawStatusUpdate = async (req, res) => {
  const { transaction_id, status } = req.body;
  try {
    var query = "";
    if (status > 1) {
      query =
        "UPDATE `shop_transaction` SET `status` = ?, `transaction_date` = NOW() WHERE `transaction_id` = ?";
    } else {
      query =
        "UPDATE `shop_transaction` SET `status` = ?, `transaction_date` = NULL WHERE `transaction_id` = ?";
    }

    db.query(query, [status, transaction_id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }
      // if status is 2 (paid) then deduct the shop balance
      if (status == 2) {
        db.query(
          "SELECT * FROM `shop_transaction` WHERE `transaction_id` = ? AND `is_withdraw` = 1 ORDER BY `shop_transaction`.`transaction_id` DESC;",
          [transaction_id],
          (err1, infoTransaction) => {
            if (err1) {
              console.error(err1);
              return res.status(500).send("Internal Server Error");
            }
            db.query(
              "SELECT * FROM `shop_balance` WHERE `shop_id` = ? ORDER BY `shop_balance`.`balance_id` DESC;",
              [infoTransaction[0].shop_id],
              (err2, infoBalance) => {
                if (err2) {
                  console.error(err2);
                  return res.status(500).send("Internal Server Error");
                }
                const newBalance =
                  infoBalance[0].own_balance - infoTransaction[0].amount;
                db.query(
                  "UPDATE `shop_balance` SET `own_balance` = ? WHERE `shop_id` = ?;",
                  [newBalance, infoTransaction[0].shop_id],
                  (err3, results) => {
                    if (err3) {
                      console.error(err3);
                      return res.status(500).send("Internal Server Error");
                    }
                    res.json({
                      status: "success",
                      message: "Status updated successfully",
                    });
                  }
                );
              }
            );
          }
        );
      } else {
        res.json({
          status: "success",
          message: "Status updated successfully",
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.withDrawFilter = (req, res) => {
  const { sDate, eDate, phn, countryName } = req.body;
  res.cookie("sDate", sDate, { path: "/" });
  res.cookie("eDate", eDate, { path: "/" });
  res.cookie("phn", phn, { path: "/" });
  res.cookie("__ctrN", countryName, { path: "/" });
  res.redirect("back");
};

exports.withDrawFilterClear = (req, res) => {
  res.clearCookie("sDate", { path: "/" });
  res.clearCookie("eDate", { path: "/" });
  res.clearCookie("phn", { path: "/" });
  res.clearCookie("__ctrN", { path: "/" });
  res.redirect("back");
};
