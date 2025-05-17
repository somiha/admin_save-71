const db = require("../config/database.config");
const axios = require("axios");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");

exports.updateExchangeView = async (req, res) => {
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

    db.query("SELECT * FROM `exchange_rates`", (err1, res1) => {
      if (!err1) {
        db.query("SELECT * FROM `rate_update`", (err2, res2) => {
          if (!err2) {
            return res.render("updateExchange", {
              exchangeRates: res1,
              updateTime: res2,
              premissions,
              admin,
            });
          } else {
            res.status(500).json({
              error:
                "Internal server error ! Error Fetching exchange rates Date from DB !",
            });
          }
        });
      } else {
        res.status(500).json({
          error:
            "Internal server error ! Error Fetching exchange rates from DB !",
        });
      }
    });
  } catch (err) {}
};

exports.updateExchange = (req, res) => {
  // No security, anyone can just ping the link and update which will cost out free tire limit!
  const apiUrl = "https://openexchangerates.org/api/latest.json";
  const apiKey = "2d98d70a8dc9467caae29ecc2dcae6a3"; // Replace with your API key

  axios
    .get(apiUrl, {
      params: {
        app_id: apiKey,
      },
    })
    .then((response) => {
      const exchangeRates = response.data.rates;
      const baseCurrency = response.data.base;
      const timestamp = response.data.timestamp * 1000; // Convert to milliseconds

      const currencies = Object.keys(exchangeRates);

      const updateQuery = `
        UPDATE exchange_rates
        SET rate = ?,
            is_base = ?
        WHERE sign = ?;
      `;

      db.beginTransaction((err) => {
        if (err) {
          console.error("Error starting database transaction:", err);
          return res.status(500).json({
            error: "Internal server error ! Error updating exchange rates !",
          });
        }

        currencies.forEach((sign) => {
          const rate = exchangeRates[sign];
          const isBase = sign === baseCurrency ? 1 : 0;

          db.query(updateQuery, [rate, isBase, sign], (err, result) => {
            if (err) {
              db.rollback(() => {
                console.error(
                  `Error updating exchange rates for sign ${sign}:`,
                  err
                );
                return res.status(500).json({
                  error: `Internal server error ! Error updating exchange rates for sign ${sign}!`,
                });
              });
            }
          });
        });

        const rateUpdateQuery = `
          UPDATE rate_update
          SET date = ?, time = ?
          WHERE rate_update_id = 1;
        `;
        const date = new Date(timestamp)
          .toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
          .split(",")[0];
        const time = new Date(timestamp)
          .toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
          .split(",")[1]
          .trim();

        db.query(rateUpdateQuery, [date, time], (err, result) => {
          if (err) {
            db.rollback(() => {
              console.error("Error updating rate update table:", err);
              return res.status(500).json({
                error:
                  "Internal server error ! Error updating rate update table !",
              });
            });
          } else {
            db.commit((err) => {
              if (err) {
                db.rollback(() => {
                  console.error("Error committing transaction:", err);
                  return res.status(500).json({
                    error:
                      "Internal server error ! Error committing transaction !",
                  });
                });
              }

              return res.status(200).json({
                message: "Exchange rates updated successfully",
                lastUpdateTime: `${date}, ${time}`,
              });
            });
          }
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching exchange rates:", error);
      return res.status(500).json({
        error: "Internal server error ! Error in fetching exchange rates !",
      });
    });
};
