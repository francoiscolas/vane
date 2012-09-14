var _    = require('underscore');
var PATH = require('path');
var Log  = require('./log');

var Assets = module.exports = function (application, options) {
    this.application = application;

    this.javascripts = [];
    this.stylesheets = [];

    this._configure(options);
};

Assets.prototype = {

    getJavascriptFiles: function (/*String... groups*/) {
        var javascripts = [];

        if (this.application.isProduction())
        {
            if (arguments.length === 0)
            {
                _.each(this.javascripts, function (files, group) {
                    if (_.isArray(files) && files.length > 0)
                        javascripts.push('/assets/' + group + '.js');
                });
            }
            else
            {
                _.each(arguments, function (group) {
                    var files = this.javascripts[group];

                    if (_.isArray(files) && files.length > 0)
                        javascripts.push('/assets/' + group + '.js');
                }, this);
            }
        }
        else
        {
            if (arguments.length === 0)
            {
                _.each(this.javascripts, function (files, group) {
                    if (_.isArray(files) && files.length > 0)
                        javascripts = javascripts.concat(files);
                });
            }
            else
            {
                _.each(arguments, function (group) {
                    var files = this.javascripts[group];

                    if (_.isArray(files) && files.length > 0)
                        javascripts = javascripts.concat(files);
                }, this);
            }
        }
        return javascripts;
    },

    getStylesheetFiles: function (/*String... groups*/) {
        var stylesheets = [];

        if (this.application.isProduction())
        {
            if (arguments.length === 0)
            {
                _.each(this.stylesheets, function (files, group) {
                    if (_.isArray(files) && files.length > 0)
                        stylesheets.push('/assets/' + group + '.js');
                });
            }
            else
            {
                _.each(arguments, function (group) {
                    var files = this.stylesheets[group];

                    if (_.isArray(files) && files.length > 0)
                        stylesheets.push('/assets/' + group + '.js');
                }, this);
            }
        }
        else
        {
            if (arguments.length === 0)
            {
                _.each(this.stylesheets, function (files, group) {
                    if (_.isArray(files) && files.length > 0)
                        stylesheets = stylesheets.concat(files);
                });
            }
            else
            {
                _.each(arguments, function (group) {
                    var files = this.stylesheets[group];

                    if (_.isArray(files) && files.length > 0)
                        stylesheets = stylesheets.concat(files);
                }, this);
            }
        }
        return stylesheets;
    },

    _configure: function (options) {
        var options = options || {};

        try
        {
            var settings = require(PATH.join(this.application.configDir, 'assets.json'));

            if (settings.javascripts)
                options.javascripts = settings.javascripts;
            if (settings.stylesheets)
                options.stylesheets = settings.stylesheets;
        }
        catch (error)
        {
            Log.e('vane.Assets#_configure', 'Error: %s', error.stack);
        }
        _.extend(this, options);
    }

};
