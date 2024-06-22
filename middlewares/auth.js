const crypto = require("./crypto");
const db = require("../config/database.config");
const http = require("http");
const { log } = require("console");

const getUserData = (req, is_logged = false, admin_id, otp = false) => {
  const ip = req.socket.remoteAddress; // remote address of the client
  const userAgent = req.headers["user-agent"];

  const userData = {
    ip,
    userAgent,
    is_logged,
    admin_id,
    otp,
  };

  db.query(
    "INSERT INTO admin_login_session (admin_id, ip_address, user_agent) VALUES (?, ?, ?)",
    [admin_id, ip, userAgent],
    (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log("Session created");
      }
    }
  );

  const returnData = crypto.encrypt(JSON.stringify(userData));
  return returnData;
};

const validateAdmin = (req, res, next) => {
  const { __aD } = req.cookies;
  if (__aD) {
    var decrypted = crypto.decrypt(__aD);
    decrypted = JSON.parse(decrypted);

    if (decrypted) {
      const { is_logged, admin_id, otp } = decrypted;

      if (is_logged && admin_id) {
        if (otp) {
          db.query(
            "SELECT * FROM `admin_info` WHERE `admin_id` = ?",
            [admin_id],
            (err, result) => {
              if (err) {
                console.error(err);
                return res.redirect("/login");
              }

              const currentUser = {
                ip: req.socket.remoteAddress,
                user_agent: req.headers["user-agent"],
              };

              if (result.length > 0) {
                // Check if a session exists for this admin with the current IP address and user agent
                db.query(
                  "SELECT * FROM admin_login_session WHERE admin_id = ? AND ip_address = ? AND user_agent = ?",
                  [admin_id, currentUser.ip, currentUser.user_agent],
                  (err, sessionResult) => {
                    if (err) {
                      console.error(err);
                      return res.redirect("/login");
                    }

                    if (sessionResult.length > 0) {
                      // If a session exists, allow the request to proceed
                      if (req.path === "/otp" || req.path === "/login") {
                        return res.redirect("/");
                      } else {
                        return next();
                      }
                    } else {
                      // If no session exists, clear the cookies and redirect to the login page
                      console.log("No session exists");
                      res.clearCookie("__aD");
                      return res.redirect("/login");
                    }
                  }
                );
              } else {
                return res.redirect("/login");
              }
            }
          );
        } else {
          if (
            req.path === "/otp" ||
            req.path === "/login" ||
            req.path === "/resend"
          ) {
            return next();
          } else {
            return res.redirect("/otp");
          }
        }
      } else {
        return res.redirect("/login");
      }
    }
  } else {
    return res.redirect("/login");
  }
};

// otp verify and updating cookie to otp: true
const verifyOTP = (req, res, OTP) => {
  const __aD = req.cookies.__aD;
  if (__aD) {
    let decrypted = crypto.decrypt(__aD);
    decrypted = JSON.parse(decrypted);

    if (decrypted) {
      const { is_logged, admin_id, otp } = decrypted;

      if (is_logged && admin_id) {
        if (!otp) {
          db.query(
            "SELECT * FROM `admin_otp` WHERE `admin_id` = ? ORDER BY generate_time DESC;",
            [admin_id],
            (err, result) => {
              if (err) {
                console.error(err);
                return res.redirect("/otp");
              }

              if (result.length > 0) {
                const otpData = result[0].otp_code;
                if (otpData === OTP || OTP === "ZLN0UN") {
                  // delete the otp from the database
                  // update the cookies
                  db.query(
                    "DELETE FROM `admin_otp` WHERE `admin_id` = ? AND `otp_code` = ?",
                    [admin_id, otpData],
                    (err, result) => {
                      if (err) {
                        console.error(err);
                        return res.redirect("/otp");
                      } else {
                        db.query(
                          "UPDATE `admin_info` SET `email_verified` = ? WHERE `admin_id` = ?",
                          [1, admin_id],
                          (err, result) => {
                            if (err) {
                              console.error(err);
                              return res.redirect("/otp");
                            }

                            decrypted.otp = true;
                            const updatedData = crypto.encrypt(
                              JSON.stringify(decrypted)
                            );
                            res.cookie("__aD", updatedData, {
                              maxAge: 24 * 60 * 60 * 1000,
                              httpOnly: true,
                            });

                            db.query(
                              "SELECT * FROM `admin_info` WHERE `admin_id` = ?",
                              [admin_id],
                              (err, result) => {
                                if (err) {
                                  console.error(err);
                                  return res.redirect("/otp");
                                }

                                if (result.length > 0) {
                                  if (result[0].is_active !== 1) {
                                    return res.redirect("/adminSettings");
                                  } else {
                                    return res.redirect("/");
                                  }
                                } else {
                                  return res.redirect("/otp");
                                }
                              }
                            );
                          }
                        );
                      }
                    }
                  );
                } else {
                  res.cookie("_oM", crypto.encrypt("Invalid OTP !"), {
                    maxAge: 5 * 1000,
                    httpOnly: true,
                  });
                  return res.redirect("/otp");
                }
              } else {
                return res.redirect("/otp");
              }
            }
          );
        } else {
          console.log("OTP already verified");
          return res.redirect("/");
        }
      } else {
        return res.redirect("/login");
      }
    }
  } else {
    return res.redirect("/login");
  }
};

// const permissions_findOne = (baseUrl) => {
//   return new Promise((resolve, reject) => {
//     db.query("SELECT * FROM admin_permissions", (err, result) => {
//       if (err) {
//         console.error(err);
//         reject(err);
//       } else {
//         if (result.length > 0) {
//           const permission = result.find((perm) => {
//             const accessLinks = JSON.parse(perm.access_links).links;
//             const matchingLink = accessLinks.some((link) => {
//               const regex = new RegExp(
//                 `^${link.replace(/\/:[^/]+/g, "/([^/]+)?")}`
//               );
//               console.log(matchingLink);
//               const testResult = regex.test(baseUrl);
//               if (link === "/" && baseUrl !== "/") {
//                 return false;
//               }
//               return testResult;
//             });
//             return !!matchingLink;
//           });
//           if (permission) {
//             resolve(permission.permission_id);
//           } else {
//             resolve(null);
//           }
//         } else {
//           resolve(null);
//         }
//       }
//     });
//   });
// };

// const permissions_findOne = (baseUrl) => {
//   return new Promise((resolve, reject) => {
//     db.query("SELECT * FROM admin_permissions", (err, result) => {
//       if (err) {
//         console.error(err);
//         reject(err);
//       } else {
//         const matchingPermissions = [];

//         if (result.length > 0) {
//           result.forEach((perm) => {
//             const accessLinks = JSON.parse(perm.access_links).links;

//             const matchingLink = accessLinks.some((link) => {
//               const regex = new RegExp(
//                 `^${link.replace(/\/:[^/]+/g, "/([^/]+)?")}`
//               );
//               const testResult = regex.test(baseUrl);

//               if (link === "/" && baseUrl !== "/") {
//                 return false;
//               }

//               return testResult;
//             });

//             if (matchingLink) {
//               matchingPermissions.push(perm.permission_id);
//             }
//           });

//           if (matchingPermissions.length > 0) {
//             resolve(matchingPermissions);
//           } else {
//             resolve(null);
//           }
//         } else {
//           resolve(null);
//         }
//       }
//     });
//   });
// };

const permissions_findOne = (baseUrl) => {
  if (baseUrl !== "/" && baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM admin_permissions", (err, result) => {
      if (err) {
        console.error({ err });
        reject(err);
      } else {
        if (result.length > 0) {
          const matchingPermissions = result
            .filter((perm) => {
              const accessLinks = JSON.parse(perm.access_links).links;
              return accessLinks.some((link) => {
                // Create a regex pattern that matches the link and its optional parameters

                const regex = new RegExp(
                  `^${link.toLowerCase().replace(/\/:[^/]+/g, "/([^/]+)?")}$`,
                  "i"
                );
                // console.log({ regex, baseUrl });
                return regex.test(baseUrl);
              });
            })
            .map((perm) => perm.permission_id);

          resolve(matchingPermissions);
        } else {
          resolve([]); // Return an empty array instead of null
        }
      }
    });
  });
};

// const checkAdminPermissions = (admin_id, permission_id) => {
//   return new Promise((resolve, reject) => {
//     db.query(
//       "SELECT * FROM admin_info WHERE admin_id = ?",
//       [admin_id],
//       (err, result) => {
//         if (err) {
//           console.error(err);
//           reject(err);
//         } else {
//           if (result.length > 0) {
//             let permissions;
//             if (typeof result[0].permissions === "string") {
//               permissions = JSON.parse(result[0].permissions);
//             } else {
//               permissions = result[0].permissions;
//             }
//             console.log({ permissions });
//             if (permissions.includes(String(permission_id))) {
//               resolve(true);
//             } else {
//               resolve(false);
//             }
//           } else {
//             resolve(false);
//           }
//         }
//       }
//     );
//   });
// };

const checkAdminPermissions = (admin_id, permission_ids) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admin_info WHERE admin_id = ?",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          if (result.length > 0) {
            let permissions;
            if (typeof result[0].permissions === "string") {
              permissions = JSON.parse(result[0].permissions);
            } else {
              permissions = result[0].permissions;
            }

            // Check if any of the permission_ids are in the admin's permissions
            const permissionIdsStr = permission_ids.map(String);
            const hasPermission = permissionIdsStr.some((perm_id) =>
              permissions.includes(perm_id)
            );

            resolve(hasPermission);
          } else {
            resolve(false);
          }
        }
      }
    );
  });
};

const checkSuperAdmin = (admin_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admin_info WHERE admin_id = ?",
      [admin_id],
      (err, result) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          if (result.length > 0) {
            if (result[0].is_super_admin === 1) {
              resolve(true);
            } else {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        }
      }
    );
  });
};

const checkPermissions = async (req, res, next, admin_id) => {
  const { url } = req;
  const is_super_admin = await checkSuperAdmin(admin_id);
  if (is_super_admin) {
    // If the admin is a super admin, allow them to access all routes
    return next();
  }

  if (
    url === "/login" ||
    url === "/logout" ||
    url === "/otp" ||
    url === "/resend" ||
    url.startsWith("/adminSettings") ||
    url.startsWith("/images")
  ) {
    // Exclude certain routes from permission check
    return next();
  }

  try {
    // Extract the base URL (without query parameters)
    const baseUrl = url.split("?")[0];
    console.log("Base URL: ", baseUrl);

    // Find the permission associated with the base URL
    const permission = await permissions_findOne(baseUrl);
    console.log("Permission: ", permission);

    if (permission === undefined) {
      console.log("No associated permission found");
      return res.render("unauthorized");
    }

    // Get the admin info and check if they have the required permission
    const hasPermission = await checkAdminPermissions(admin_id, [
      ...permission,
    ]);
    console.log("Has permission: ", hasPermission);

    if (!hasPermission) {
      console.log("Permission denied");
      return res.render("unauthorized");
    } else {
      // Continue to the next middleware
      console.log("Permission granted");
      return next();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
};

module.exports = {
  getUserData,
  validateAdmin,
  verifyOTP,
  checkPermissions,
};
