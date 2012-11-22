var _ = require('underscore');

var Route = module.exports = function (path, options) {
    this.path             = path;
    this.pathRE           = this._compile(path);

    this.to               = null;
    this.via              = ['get','post','put','delete'];
    this.redirectTo       = null;
    this.autoParseBody    = undefined;
    this.maxContentLength = undefined;

    _.extend(this, options);
};

Route.prototype = {

    match: function (path) {
        var params = null;
        var pathRE = this.pathRE;
        var matches;

        if ((matches = path.match(pathRE)) !== null)
        {
            params = {};
            for (var i = 0; i < pathRE.keys.length; i++)
                params[pathRE.keys[i]] = matches[i + 1];
        }
        return params;
    },

    setPath: function (path) {
        this.path = path;
        this.pathRE = (path !== null) ? this._compile(path) : null;
    },

    getController: function () {
        var tokens;

        if (_.isString(this.to)
                && (tokens = this.to.split('#')).length === 2)
            return tokens[0];
        return null;
    },

    getAction: function () {
        var tokens;

        if (_.isString(this.to)
                && (tokens = this.to.split('#')).length === 2)
            return tokens[1];
        return null;
    },

    _compile: function (path) {
        var keys    = [];
        var pattern = path.replace(/:(\w+)?/g, function (str, key) {
            keys.push(key);
            return "([a-zA-Z0-9-$_.+!*'(),%]+)"; // According to RFC-1738 (http://www.rfc-editor.org/rfc/rfc1738.txt).
        });

        return _.extend(new RegExp('^' + pattern + '$'), {
            keys: keys
        });
    },

    get to() {
        if (this.controller !== null && this.action !== null)
            return this.controller + '#' + this.action;
        return null;
    },

    set to(to) {
        var tokens;

        if (to === null)
        {
            this.controller = null;
            this.action = null;
        }
        else if (_.isString(to) && (tokens = to.split('#')).length === 2)
        {
            this.controller = tokens[0];
            this.action = tokens[1];
        }
    }

};
