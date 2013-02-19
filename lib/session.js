var _ = require('underscore');

var Session = function (id, params) {
    this.id         = id;
    this.attributes = {};
    this.adapter    = params.adapter;
    this.request    = params.request;
    this.response   = params.response;
    this._cookieCreate();
};

Session.prototype = {

    set: function (key, value, options) {
        var attrs;

        if (_.isObject(key) || !key) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }
        options || (options = {});

        for (var key in attrs) {
            if (options.unset)
                delete this.attributes[key];
            else
                this.attributes[key] = attrs[key];
        }
    },

    unset: function (key) {
        this.set(key, null, {unset: true});
    },

    get: function (key) {
        return this.attributes[key];
    },

    has: function (key) {
        return (this.attributes[key] !== undefined);
    },

    save: function (callback) {
        this.adapter.save(this, callback);
    },

    destroy: function (callback) {
        this._cookieDestroy();
        this.adapter.destroy(this, callback);
    },

    toJSON: function () {
        return _.clone(this.attributes);
    },

    _cookieCreate: function () {
        var cookieName = this.adapter.factory.cookieName;

        if (this.request.cookies[cookieName] === undefined) {
            var cookie = {};

            cookie[cookieName] = this.id;
            cookie['HttpOnly'] = null;
            cookie['Path'] = '/';
            if (this.request.connection.encrypted)
                cookie['Secure'] = null;
            this.response.setCookie(cookie);
        }
    },

    _cookieDestroy: function () {
        var cookieName = this.adapter.factory.cookieName;
        this.response.setCookie(cookieName, '');
    }

};

module.exports = Session;
