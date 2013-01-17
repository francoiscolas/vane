var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var ControllerFactory = function (application) {
    this.application    = application;

    this.controllersDir = PATH.join(this.application.rootDir, 'app', 'controllers');
    this._classes       = {};
};

ControllerFactory.prototype = {

    create: function (controller) {
        if (this.application.isProduction()) {
            if (_.isEmpty(this._classes))
                this._load();
        } else {
            this._load(controller);
        }
        return (this._classes[controller]) ? new this._classes[controller](controller, {application: this.application}) : null;
    },

    _load: function (controller) {
            this._getFilesIn(this.controllersDir).forEach(function (file) {
                var name = file.replace(/_controller.js$/, '');

                try {
                    if (!controller || controller === name) {
                        var path = PATH.join(this.controllersDir, file);

                        if (require.cache[path])
                            require.cache[path] = null;
                        this._classes[name] = require(path);
                    }
                } catch (error) {
                    log.e('error loading "%s" controller');
                    log.e(error.stack || error);
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

module.exports = ControllerFactory;
