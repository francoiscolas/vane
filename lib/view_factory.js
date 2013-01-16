var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var Log  = require('./log');
var View = require('./view');

var ViewFactory = module.exports = function (application) {
    this.application = application;

    this.viewsDir    = PATH.join(this.application.rootDir, 'app', 'views');
    this._layouts    = {};
    this._views      = {};
};

ViewFactory.prototype = {

    create: function (layout, view, options) {
        if (this.application.isProduction()) {
            if (_.isEmpty(this._layouts))
                this._load();
        } else {
            this._load(layout, view);
        }
        return (this._views[view]) ? new View(this._layouts[layout], this._views[view], options) : null;
    },

    _load: function (layout, view) {
            this._getFilesIn(this.viewsDir).forEach(function (file) {
                var filepath = PATH.join(this.viewsDir, file);
                var matches  = file.match(/^(layouts\/)?(.*).html.jst/);

                if (matches !== null) {
                    try {
                        if (matches[1] !== undefined) {
                            var name = matches[2];

                            if (!layout || layout === name)
                                this._layouts[name] = _.template(FS.readFileSync(filepath, 'UTF-8'));
                        } else {
                            var name = matches[2];

                            if (!view || view === name)
                                this._views[name] = _.template(FS.readFileSync(filepath, 'UTF-8'));
                        }
                    } catch (error) {
                        Log.e('vane', 'Error loading view %s.', filepath);
                    }
                }
            }, this);
    },

    _getFilesIn: function (dir) {
        var files = [];

        (function walk(dir, prefix) {
            FS.readdirSync(dir).forEach(function (entry) {
                var path = PATH.join(dir, entry);
                var name = ((prefix) ? prefix + '/' : '') + entry;

                if (FS.statSync(path).isDirectory())
                    walk(path, name);
                else
                    files.push(name);
            });
        })(dir);
        return files;
    }

};
