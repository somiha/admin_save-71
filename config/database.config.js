const mysql = require("mysql2");
// const dotenv = require('dotenv');

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "save-71_2",
});

db.connect(function (error) {
  if (error) {
    console.log(error);
  } else {
    console.log("Database Connected!");
  }
});

module.exports = db;

// const mysql = require("mysql2");
// // const dotenv = require('dotenv');

// // const db = mysql.createConnection({
// //   host: "localhost",
// //   user: "root",
// //   password: "12345678",
// //   database: "save-71_2",
// // });

// // const db = mysql.createConnection({
// //   host: "localhost",
// //   user: "root",
// //   password: "",
// //   database: "lensnmza_save-71",
// // });

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "lensnmza_somiha1",
//   password: "8A7=7o8l1~c5",
//   database: "lensnmza_save-71",
// });

// db.connect(function (error) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Database Connected!");
//   }
// });

// module.exports = db;
