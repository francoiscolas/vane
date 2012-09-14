var _ = require('underscore');

var Log = require('./log');

var View = module.exports = function (controller, layout, view) {
    this.controller = controller;
    this.layout     = layout;
    this.view       = view;
};

View.prototype = {

    render: function (partial, options) {
        if (partial)
            return this._renderPartial(partial, options);
        else
            return this._renderMain();
    },

    includeJavascripts: function (/*String... groups*/) {
        var assets = this.controller.application.assets;
        var files  = assets.getJavascriptFiles.apply(assets, arguments);
        var tags   = [];

        files.forEach(function (file) {
            tags.push('<script type="text/javascript" src="/' + file + '"></script>');
        });
        return tags.join('\n');
    },

    includeStylesheets: function (/*String... groups*/) {
        var assets = this.controller.application.assets;
        var files  = assets.getStylesheetFiles.apply(assets, arguments);
        var tags  = [];

        files.forEach(function (file) {
            tags.push('<link rel="stylesheet" type="text/css" href="/' + file + '" />');
        });
        return tags.join('\n');
    },

    yield: function (contentFor) {
        return this.view(_.extend({}, this.controller, this, {contentFor: contentFor}));
    },

    _renderMain: function () {
        var context = _.extend({}, this.controller, this);

        if (this.layout)
            return this.layout(context);
        else
            return this.view(context);
    },

    _renderPartial: function (partial, options) {
        var layout   = (options && options.layout) || null;
        var viewPath = (partial.indexOf('/') < 0) ? this.controller.name + '/_' + partial : partial;
        var view;
       
        if ((view = this.controller.application.views.get(this.controller, layout, viewPath)) === null)
            Log.e('vane.View#_renderPartial', '[%s] Error: Can\'t create the partial view "%s".', this.request.peerName, viewPath);
        else
            return view.render();
    }

};
