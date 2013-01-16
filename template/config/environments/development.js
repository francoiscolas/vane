module.exports = {
    "servePublicDir": true,

    "host": "127.0.0.1",
    "port": 8080,

    "i18n": {
        "defaultLocale": "en"
    },

    "router": {
        "autoParseBody"   : true,
        "maxContentLength": 2 * 1024 * 1024,
        "uploadDir"       : require("os").tmpDir()
    },

    "database": {
        "uri": "mongodb://127.0.0.1/__APP_NAME_LOWER___development"
    }
};
