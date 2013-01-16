var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var I18n = function (application) {
    this.application   = application;

    this.defaultLocale = 'en';
    this.localesDir    = PATH.join(this.application.configDir, 'locales');

    this._locales      = {};

    this._load();
};

I18n.prototype = {

    tr: function (locale, tag/*, args*/) {
        var args    = Array.prototype.slice.call(arguments, 2);
        var tokens  = tag.split('.');
        var current = this._locales[locale || this.defaultLocale];

        for (var i = 0; i < tokens.length; i++) {
            if (_.has(current, tokens[i])) {
                current = current[tokens[i]];
            } else {
                current = tag;
                break;
            }
        }
        return current.replace(/%[0-9]+/g, function (match) {
            return args[match.substr(1) - 1];
        });
    },

    _load: function () {
        FS.readdirSync(this.localesDir).forEach(function (entry) {
            var matches;

            if ((matches = entry.match(/(.*)\.json$/)) !== null) {
                var path   = PATH.join(this.localesDir, entry);
                var locale = matches[1];

                if (require.cache[path])
                    require.cache[path] = null;
                this._locales[locale] = require(path);
            }
        }, this);
    }

};

module.exports = I18n;
