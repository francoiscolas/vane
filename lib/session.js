var Session = module.exports = require('./model').extend('sessions', {

    _request: null,

    _response: null,

    initialize: function (attributes, options) {
        _.extend(this, options);
    },

    save: function () {
        Log.d('vane.Session#save', '[%s] Saving session changes.', this._request.peerName);
        this.set('updatedAt', Date.now());
        this._super.prototype.save.apply(this, arguments);
    },

    destroy: function () {
        Log.d('vane.Session#destroy', '[%s] Destroying session.', this._request.peerName);
        this._request.session = null;
        this._request = null;
        this._response.setCookie(Session.COOKIE_NAME, '');
        this._response = null;
        this._super.prototype.destroy.apply(this, arguments);
    }

});

var _           = require('underscore');
var Application = require('./application');
var Log         = require('./log');

Session.MAX_INACTIVE_TIME = 12 * 60 * 60 * 1000; // 12h

Session.COOKIE_NAME = 'SID';

Session.purge = function () {
    var expires = Date.now() - Session.MAX_INACTIVE_TIME;

    Session.find({updatedAt: {$lte: expires}}).destroy(function (count) {
        Log.i('vane.Session.purge', '%d session(s) destroyed.', count);
    });
};
Session.purge.timer = null;

Session.start = function (callback) {
    Session.purge.timer = setInterval(Session.purge, 60 * 60 * 1000); // checks inactive sessions every hour.
    callback && callback(null);
};

Session.stop = function (callback) {
    clearInterval(Session.purge.timer);
    callback && callback();
};

Session.new = function (request, response, callback) {
    var cookie;

    if ((cookie = request.cookies[Session.COOKIE_NAME]) !== undefined)
        Session.load(request, response, cookie, callback);
    else
        Session.create(request, response, callback);
};

Session.load = function (request, response, cookie, callback) {
    Log.d('vane.Session.load', '[%s] Loading session (cookie="%s").', request.peerName, cookie);
    Session.find({_cookie: cookie}).get(function (session) {
        if (session === null) {
            Session.create(request, response, callback);
        } else {
            session._request = request;
            session._response = response;
            callback(session);
        }
    });
};

Session.create = function (request, response, callback) {
    Session.generateCookieId(function (cookie) {
        Log.d('vane.Session.create', '[%s] Creating session (cookie="%s").', request.peerName, cookie);
        response.setCookie(Session.COOKIE_NAME, cookie);
        callback((new Session({}, {
            _request : request,
            _response: response
        })).set('_cookie', cookie));
    });
};

Session.generateCookieId = function (callback) {
    var cookieId = (function () {
        var cookieId = '';
        var chars    = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        for (var i = 0; i < 64; i++)
            cookieId += chars[Math.round(Math.random() * (chars.length - 1))];
        return cookieId;
    })();
    Session.find({_cookie: cookieId}).count(function (n) {
        if (n > 0)
            Session.generateCookieId(callback);
        else
            callback(cookieId);
    });
};
