var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var Log = require('./log');

var ControllerFactory = module.exports = function (application) {
    this.application = application;
    this._classes    = {};
};

ControllerFactory.prototype = {

    get: function (controller) {
        if (this.application.isProduction())
        {
            if (_.isEmpty(this._classes))
                this._load();
        }
        else
        {
            this._load(controller);
        }
        return (this._classes[controller]) ? new this._classes[controller](controller, this.application) : null;
    },

    _load: function (controller) {
        var controllersDir = PATH.join(this.application.rootDir, 'app', 'controllers');

        try
        {
            this._getFilesIn(controllersDir).forEach(function (file) {
                var name = file.replace(/_controller.js$/, '');

                if (!controller || controller === name)
                {
                    var path = PATH.join(controllersDir, file);

                    if (require.cache[path])
                        require.cache[path] = null;
                    this._classes[name] = require(path);
                }
            }, this);
        }
        catch (error)
        {
            Log.e('vane.ControllerFactory#_load', 'Error while loading controllers from "app/controllers".');
            Log.e('vane.ControllerFactory#_load', 'Error: %s', error.stack);
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
