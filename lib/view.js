var _ = require('underscore');

var View = function (layout, view, options) {
    options || (options = {});

    this.layout     = layout;
    this.view       = view;
    this.name       = options.name;
    this.controller = options.controller;
};

View.prototype = {

    render: function (partial, options) {
        if (_.isObject(partial)) {
            options = partial;
            partial = null;
        }

        if (partial)
            return this._renderPartial(partial, options);
        else
            return this._renderMain(options);
    },

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
    },

    yield: function (contentFor) {
        return this.view(_.extend({}, this.controller, this, {contentFor: contentFor}));
    },

    tr: function (tag/*, args*/) {
        var i18n = this.controller.application.i18n;
        var name = this.name.split('/').pop();

        return i18n.tr.apply(i18n, [
            this.session.get('locale'), (tag[0] === '.') ? this.controller.name + '.' + name + tag : tag
        ].concat(Array.prototype.slice.call(arguments, 1)));
    },

    _renderMain: function (options) {
        var context = _.extend({}, this.controller, this);

        if (options.flash)
            context.flahs = options.flash;

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
            log.e('[%s] Error: Can\'t create the partial view "%s".', this.request.peerName, viewPath);
        else
            return view.render(options);
    }

};

module.exports = View;
