// cat.js

const db = require("../config/database.config");

// Helper function for fetching main_cat data from the database
exports.fetchMainCat = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `main_cat` ORDER BY `main_cat`.`main_cat_name` ASC", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

// Helper function for fetching sub_cat data from the database
exports.fetchSubCat = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `sub_cat` ORDER BY `sub_cat`.`sub_cat_name` ASC", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

// Helper function for fetching extra_cat data from the database
exports.fetchExtraCat = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `extra_cat` ORDER BY `extra_cat`.`extra_cat_name` ASC, `extra_cat`.`popular_cat_value` DESC", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

// Helper function for fetching allCat data from the database
exports.fetchAllCat = () => {
    return new Promise((resolve, reject) => {
        db.query(
            "SELECT * FROM `sub_cat` INNER JOIN `main_cat` ON `main_cat`.`main_cat_id` = `sub_cat`.`sub_cat_ref` INNER JOIN `extra_cat` ON `sub_cat`.`sub_cat_id` = `extra_cat`.`extra_cat_ref`  INNER JOIN `products` ON `extra_cat`.`extra_cat_id` = `products`.`product_cat_id`",
            (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
};


exports.fetchAllProducts = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `products`", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.fetchFeaturedImages = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `products` INNER JOIN `product_image` ON `products`.`product_id` = `product_image`.`product_id` WHERE `product_image`.`featured_image` = 1", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.fetchAllImages = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `product_image`", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.fetchAllVideos = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `product_video`", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.fetchFeaturedTempImages = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `product_template` INNER JOIN `product_temp_images` ON `product_template`.`temp_id` = `product_temp_images`.`product_temp_id` WHERE `product_temp_images`.`featured_image` = 1", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.fetchAllTempImages = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `product_template` INNER JOIN `product_temp_images` ON `product_template`.`temp_id` = `product_temp_images`.`product_temp_id`", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.fetchTempVideo = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `product_template` INNER JOIN `product_temp_video` ON `product_template`.`temp_id` = `product_temp_video`.`product_temp_id`", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.fetchCurrencyRate = (countryCode) => {
    return new Promise((resolve, reject) => {
        const currencyCodes = {
            'AF': 'AFN',
            'AX': 'EUR',
            'AL': 'ALL',
            'DZ': 'DZD',
            'AS': 'USD',
            'AD': 'EUR',
            'AO': 'AOA',
            'AQ': 'XCD',
            'AG': 'XCD',
            'AR': 'ARS',
            'AM': 'AMD',
            'AW': 'AWG',
            'AU': 'AUD',
            'AT': 'EUR',
            'AZ': 'AZN',
            'BS': 'BSD',
            'BH': 'BHD',
            'BD': 'BDT',
            'BB': 'BBD',
            'BY': 'BYR',
            'BE': 'EUR',
            'BZ': 'BZD',
            'BJ': 'XOF',
            'BM': 'BMD',
            'BT': 'BTN',
            'BO': 'BOB',
            'BA': 'BAM',
            'BW': 'BWP',
            'BV': 'NOK',
            'BR': 'BRL',
            'IO': 'USD',
            'BN': 'BND',
            'BG': 'BGN',
            'BF': 'XOF',
            'BI': 'BIF',
            'KH': 'KHR',
            'CM': 'XAF',
            'CA': 'CAD',
            'CV': 'CVE',
            'KY': 'KYD',
            'CF': 'XAF',
            'TD': 'XAF',
            'CL': 'CLP',
            'CN': 'CNY',
            'CX': 'AUD',
            'CC': 'AUD',
            'CO': 'COP',
            'KM': 'KMF',
            'CG': 'XAF',
            'CD': 'CDF',
            'CK': 'NZD',
            'CR': 'CRC',
            'CI': 'XOF',
            'HR': 'HRK',
            'CU': 'CUP',
            'CY': 'EUR',
            'CZ': 'CZK',
            'DK': 'DKK',
            'DJ': 'DJF',
            'DM': 'XCD',
            'DO': 'DOP',
            'EC': 'USD',
            'EG': 'EGP',
            'SV': 'USD',
            'GQ': 'XAF',
            'ER': 'ERN',
            'EE': 'EUR',
            'ET': 'ETB',
            'FK': 'FKP',
            'FO': 'DKK',
            'FJ': 'FJD',
            'FI': 'EUR',
            'FR': 'EUR',
            'GF': 'EUR',
            'PF': 'XPF',
            'TF': 'EUR',
            'GA': 'XAF',
            'GM': 'GMD',
            'GE': 'GEL',
            'DE': 'EUR',
            'GH': 'GHS',
            'GI': 'GIP',
            'GR': 'EUR',
            'GL': 'DKK',
            'GD': 'XCD',
            'GP': 'EUR',
            'GU': 'USD',
            'GT': 'GTQ',
            'GG': 'GBP',
            'GN': 'GNF',
            'GW': 'XOF',
            'GY': 'GYD',
            'HT': 'HTG',
            'HM': 'AUD',
            'VA': 'EUR',
            'HN': 'HNL',
            'HK': 'HKD',
            'HU': 'HUF',
            'IS': 'ISK',
            'IN': 'INR',
            'ID': 'IDR',
            'IR': 'IRR',
            'IQ': 'IQD',
            'IE': 'EUR',
            'IM': 'GBP',
            'IL': 'ILS',
            'IT': 'EUR',
            'JM': 'JMD',
            'JP': 'JPY',
            'JE': 'GBP',
            'JO': 'JOD',
            'KZ': 'KZT',
            'KE': 'KES',
            'KI': 'AUD',
            'KP': 'KPW',
            'KR': 'KRW',
            'KW': 'KWD',
            'KG': 'KGS',
            'LA': 'LAK',
            'LV': 'EUR',
            'LB': 'LBP',
            'LS': 'LSL',
            'LR': 'LRD',
            'LY': 'LYD',
            'LI': 'CHF',
            'LT': 'LTL',
            'LU': 'EUR',
            'MO': 'MOP',
            'MK': 'MKD',
            'MG': 'MGA',
            'MW': 'MWK',
            'MY': 'MYR',
            'MV': 'MVR',
            'ML': 'XOF',
            'MT': 'EUR',
            'MH': 'USD',
            'MR': 'EUR',
            'MU': 'MUR',
            'YT': 'EUR',
            'MX': 'MXN',
            'FM': 'USD',
            'MD': 'MDL',
            'MC': 'EUR',
            'MN': 'MNT',
            'MS': 'XCD',
            'MA': 'MAD',
            'MZ': 'MZN',
            'MM': 'MMK',
            'NA': 'NAD',
            'NR': 'AUD',
            'NP': 'NPR',
            'NL': 'EUR',
            'AN': 'ANG',
            'NC': 'XPF',
            'NZ': 'NZD',
            'NE': 'XOF',
            'NG': 'NGN',
            'NU': 'NZD',
            'NF': 'AUD',
            'MP': 'USD',
            'NO': 'NOK',
            'OM': 'OMR',
            'PK': 'PKR',
            'PW': 'USD',
            'PS': 'ILS',
            'PA': 'PAB',
            'PG': 'PGK',
            'PY': 'PYG',
            'PE': 'PEN',
            'PH': 'PHP',
            'PN': 'NZD',
            'PL': 'PLN',
            'PT': 'EUR',
            'PR': 'USD',
            'QA': 'QAR',
            'RE': 'EUR',
            'RO': 'RON',
            'RU': 'RUB',
            'RW': 'RWF',
            'SH': 'SHP',
            'KN': 'XCD',
            'LC': 'XCD',
            'PM': 'EUR',
            'VC': 'XCD',
            'WS': 'WST',
            'ST': 'EUR',
            'SA': 'SAR',
            'SN': 'XOF',
            'ME': 'EUR',
            'SC': 'SCR',
            'SL': 'SLL',
            'SG': 'SGD',
            'SK': 'EUR',
            'SI': 'EUR',
            'SB': 'SBD',
            'SO': 'SOS',
            'ZA': 'ZAR',
            'GS': 'GBP',
            'ES': 'EUR',
            'LK': 'LKR',
            'SD': 'SDG',
            'SR': 'SRD',
            'SJ': 'NOK',
            'SZ': 'SZL',
            'SE': 'SEK',
            'CH': 'CHF',
            'SY': 'SYP',
            'TW': 'TWD',
            'TJ': 'TJS',
            'TZ': 'TZS',
            'TH': 'THB',
            'TL': 'USD',
            'TG': 'XOF',
            'TK': 'NZD',
            'TO': 'TOP',
            'TT': 'TTD',
            'TN': 'TND',
            'TR': 'TRY',
            'TM': 'TMT',
            'TC': 'USD',
            'TV': 'AUD',
            'UG': 'UGX',
            'UA': 'UAH',
            'AE': 'AED',
            'GB': 'GBP',
            'US': 'USD',
            'UM': 'USD',
            'UY': 'UYU',
            'UZ': 'UZS',
            'VU': 'VUV',
            'VE': 'VEF',
            'VN': 'VND',
            'VG': 'USD',
            'VI': 'USD',
            'WF': 'XPF',
            'EH': 'MAD',
            'ZM': 'ZMK',
            'ZW': 'ZWL',
            'RS': 'RSD',
        };

        const currencyCode = currencyCodes[countryCode.toUpperCase()];
        // console.log("curr:", currencyCode)

        db.query("SELECT `rate` FROM `exchange_rates` WHERE `sign` = ?", [currencyCode], (err, res) => {
            if (err) {
                reject(err);
            } else {
                if (res.length === 0) {
                    reject(new Error("Currency rate not found"));
                } else {
                    resolve([res[0].rate, currencyCode]);
                }
            }
        });
    });
};

exports.fetchTaxRate = (currencyCode) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT `tax_percentage` FROM `exchange_rates` WHERE `sign` = ?", [currencyCode], (err, res) => {
            if (err) {
                reject(err);
            } else {
                if (res.length === 0) {
                    reject(new Error("Currency rate not found"));
                } else {
                    resolve(res[0].tax_percentage);
                }
            }
        });
    });
};

exports.fetchAllUserInfo = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT `user`.`user_id`, `user`.`user_name`, `user`.`user_email`, `user`.`reference_id`, `user`.`phone`, `shop`.`id` FROM `user` INNER JOIN `shop` ON `shop`.`seller_user_id` = `user`.`user_id`", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};


exports.fetchAllNotifications = (userID) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM `notification` WHERE `user_id` = ? ORDER BY `notification`.`notification_id` DESC", [userID] , (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};

exports.setNotification = (userID, notification, url) => {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO `notification` (`notification_id`, `user_id`, `notification`, `url`, `is_read`) VALUES (NULL, ?, ?, ?, '0')",
        [userID, notification, url] , (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
};