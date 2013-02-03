module.exports = {

    includeJavascripts: function (/*String... groups*/) {
        var assets = this.controller.application.assets;
        var files  = assets.getJavascriptFiles.apply(assets, arguments);
        var tags   = [];

        files.forEach(function (file) {
            tags.push('<script type="text/javascript" src="' + file + '"></script>');
        });
        return tags.join('\n');
    },

    includeStylesheets: function (/*String... groups*/) {
        var assets = this.controller.application.assets;
        var files  = assets.getStylesheetFiles.apply(assets, arguments);
        var tags  = [];

        files.forEach(function (file) {
            tags.push('<link rel="stylesheet" type="text/css" href="' + file + '" />');
        });
        return tags.join('\n');
    }

};
