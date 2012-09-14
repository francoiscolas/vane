var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var Log  = require('./log');
var View = require('./view');

var ViewFactory = module.exports = function (application) {
    this.application = application;
    this._layouts    = {};
    this._views      = {};
};

ViewFactory.prototype = {

    get: function (controller, layout, view) {
        Log.d('vane.ViewFactory#get', 'controller.name=%s, layout="%s", view="%s"', controller.name, layout, view);

        if (this.application.isProduction())
        {
            if (_.isEmpty(this._layouts) || _.isEmpty(this._views))
                this._load();
        }
        else
        {
            this._load(layout, view);
        }
        return (this._views[view]) ? new View(controller, this._layouts[layout], this._views[view]) : null;
    },

    _load: function (layout, view) {
        var viewsDir = PATH.join(this.application.rootDir, 'app', 'views');

        try
        {
            this._getFilesIn(viewsDir).forEach(function (file) {
                var matches = null;
                var path    = PATH.join(viewsDir, file);

                if (file.indexOf('layouts/') === 0)
                {
                    if ((matches = file.match('^layouts/(.*).html.jst$')) !== null)
                    {
                        var name = matches[1];

                        if (!layout || layout === name)
                            this._layouts[name] = _.template(FS.readFileSync(path, 'UTF-8'));
                    }
                }
                else
                {
                    if ((matches = file.match('^(.*).html.jst$')) !== null)
                    {
                        var name = matches[1];

                        if (!view || view === name)
                            this._views[name] = _.template(FS.readFileSync(path, 'UTF-8'));
                    }
                }
                if (matches === null)
                {
                    Log.d('vane.ViewFactory#_load', 'Don\'t know how to load "%s".', file);
                }
            }, this);
        }
        catch (error)
        {
            Log.e('vane.ViewFactory#_load', 'Error while loading views from "app/views".');
            Log.e('vane.ViewFactory#_load', 'Error: %s', error.stack);
        }
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
