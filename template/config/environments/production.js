module.exports = {
    "server": {
        "host"            : "127.0.0.1",
        "port"            : 8080,
        "servePublicDir"  : false,
//        "maxContentLength": 2 * 1024 * 1024,
//        "uploadDir"       : require("os").tmpDir()
    },

    "i18n": {
        "defaultLocale": "en"
    },

    "database": {
        "uri": "mongodb://127.0.0.1/__APP_NAME_LOWER_CASE___production"
    }
};
