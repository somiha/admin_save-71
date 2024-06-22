const db = require("../config/database.config");
const catModel = require("../middlewares/cat");

exports.withDrawRequest = async (req, res) => {
  try {
    const { trId } = req.params;
    const countryName = req.cookies.__ctrN == 0 ? "" : req.cookies.__ctrN;
    const [curr] = await Promise.all([
      catModel.fetchCurrencyRate(countryName || "US"),
    ]);

    const currCode = curr.at(1);
    const currRate = curr.at(0);

    const query =
      "SELECT * FROM `shop_transaction` " +
      "INNER JOIN `shop` ON `shop`.`id` = `shop_transaction`.`shop_id` " +
      "INNER JOIN `user` ON `user`.`user_id` = `shop`.`seller_user_id` " +
      "INNER JOIN `use_bank_info` ON `user`.`user_id` = `use_bank_info`.`user_id` " +
      "WHERE `shop_transaction`.`transaction_id` = " +
      trId;

    db.query(query, (err1, res1) => {
      if (err1) {
        console.error(err1);
        return res.status(500).send("Internal Server Error");
      }

      // These are important fields that should not be sent to the client
      ["user_password", "reference_id"].forEach((item) => {
        delete res1[0][item];
      });

      return res.render("withdrawDetails", {
        withdrawDetails: res1[0],
        currCode,
        currRate,
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
    const status = parseInt(req.query.status) || 0; // Default to 0 if status is not provided

    const actions = ["Due", "Running", "Success", "Rejected"];

    let query =
      "SELECT * FROM `shop_transaction` " +
      "INNER JOIN `shop` ON `shop`.`id` = `shop_transaction`.`shop_id` " +
      "INNER JOIN `user` ON `user`.`user_id` = `shop`.`seller_user_id` " +
      "INNER JOIN `use_bank_info` ON `user`.`user_id` = `use_bank_info`.`user_id`";

    query += " WHERE `shop_transaction`.`status` = " + status;
    if (searchTerm) {
      query += " AND `shop_transaction`.`transaction_id` LIKE " + searchTerm;
    }

    query += " ORDER BY `shop_transaction`.`transaction_id` DESC";

    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      const paginatedWithdraw = results.slice(startIndex, endIndex);
      const totalPages = Math.ceil(results.length / itemsPerPage);

      res.json({
        currentPage: currentPage,
        totalPages: totalPages,
        withdraws: paginatedWithdraw,
        totalProducts: results.length,
        actions: actions,
        totalItems: results.length,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
