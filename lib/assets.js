var _    = require('underscore');
var PATH = require('path');
var Log  = require('./log');

var Assets = module.exports = function (application) {
    this.application = application;

    this.javascripts = {};
    this.stylesheets = {};

    this._load();
};

Assets.prototype = {

    getJavascriptFiles: function (/*String... groups*/) {
        var javascripts = [];
        var iterator    = null;

        if (this.application.isProduction()) {
            iterator = function (group) {
                var files = this.javascripts[group];

                if (files && files.length > 0)
                    javascripts.push('/assets/' + group + '.js');
            };
        } else {
            iterator = function (group) {
                var files = this.javascripts[group];

                if (files && files.length > 0)
                    javascripts = javascripts.concat(files);
            };
            this._load();
        }
        _.each((arguments.length > 0) ? arguments : _.keys(this.javascripts), iterator, this);

        return javascripts;
    },

    getStylesheetFiles: function (/*String... groups*/) {
        var stylesheets = [];
        var iterator    = null;

        if (this.application.isProduction()) {
            iterator = function (group) {
                var files = this.stylesheets[group];

                if (files && files.length > 0)
                    stylesheets.push('/assets/' + group + '.css');
            };
        } else {
            iterator = function (group) {
                var files = this.stylesheets[group];

                if (files && files.length > 0)
                    stylesheets = stylesheets.concat(files);
            };
            this._load();
        }
        _.each((arguments.length > 0) ? arguments : _.keys(this.stylesheets), iterator, this);

        return stylesheets;
    },

    _load: function () {
        try {
            var path     = PATH.join(this.application.configDir, 'assets.json');
            var settings = {};

            if (require.cache[path])
                require.cache[path] = null; 
            settings = require(path);

            if (_.isObject(settings.javascripts))
                this.javascripts = settings.javascripts;
            if (_.isObject(settings.stylesheets))
                this.stylesheets = settings.stylesheets;
        } catch (error) {
            Log.e('vane', 'Error: %s', error.stack);
        }
    }

};
