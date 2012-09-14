var _      = require('underscore');
var CRYPTO = require('crypto');
var EVENTS = require('events');
var HTTP   = require('http');
var UTIL   = require('util');

var Log    = require('./log');

var Response = module.exports = function (nresp, options) {
    EVENTS.EventEmitter.call(this);

    this.application = (options && options.application) || null;

    this.connection  = nresp.connection;

    this.peerAddress = this.connection.remoteAddress;
    this.peerPort    = this.connection.remotePort;
    this.peerName    = this.peerAddress + ':' + this.peerPort;

    this._nresp = nresp;
    this._nresp._vaneResponse = this;

    this._nreq = (options && options._nreq) || null;
};

var _privateKey = (function () {
    var private_key	= ''; 
    var chars		= 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (var i = 0; i < 32; i++)
        private_key += chars[Math.round(Math.random() * (chars.length - 1))];
    return private_key; 
})();

_.extend(Response.prototype, EVENTS.EventEmitter.prototype, {

    movedPermanently: function (location, headers) {
        Log.d('vane.Response#movedPermanently', '[%s] %s %s -> moved permanently to %s.', this.peerName, this.getRequest().method, this.getRequest().path, location);
        this.endHead(301, _.extend({
            'Location': location
        }, headers));
    },

    movedTemporarily: function (location, headers) {
        Log.d('vane.Response#movedTemporarily', '[%s] %s %s -> moved temporarily %s.', this.peerName, this.getRequest().method, this.getRequest().path, location);
        this.endHead(302, _.extend({
            'Location': location
        }, headers));
    },

    seeOther: function (location, headers) {
        Log.d('vane.Response#seeOther', '[%s] %s %s -> see other %s.', this.peerName, this.getRequest().method, this.getRequest().path, location);
        this.endHead(303, _.extend({
            'Location': location
        }, headers));
    },

    notModified: function (headers) {
        Log.d('vane.Response#notModified', '[%s] %s %s -> not modified.', this.peerName, this.getRequest().method, this.getRequest().path);
        this.endHead(304, headers);
    },

    temporaryRedirect: function (location, headers) {
        Log.d('vane.Response#temporaryRedirect', '[%s] %s %s -> temporary redirected to %s.', this.peerName, this.getRequest().method, this.getRequest().path, location);
        this.endHead(307, _.extend({
            'Location': location
        }, headers));
    },

    badRequest: function (headers) {
        Log.d('vane.Response#badRequest', '[%s] %s %s -> bad request.', this.peerName, this.getRequest().method, this.getRequest().path);
        this._defaultResponse(400);
    },

    unauthorized: function (headers) {
        Log.d('vane.Response#unauthorized', '[%s] %s %s -> unauthorized.', this.peerName, this.getRequest().method, this.getRequest().path);
        this._defaultResponse(401, headers);
    },

    forbidden: function (headers) {
        Log.d('vane.Response#forbidden', '[%s] %s %s -> forbidden.', this.peerName, this.getRequest().method, this.getRequest().path);
        this._defaultResponse(403, headers);
    },

    notFound: function (headers) {
        Log.d('vane.Response#notFound', '[%s] %s %s -> not found.', this.peerName, this.getRequest().method, this.getRequest().path);
        this._defaultResponse(404, headers);
    },

    methodNotAllowed: function (headers) {
        Log.d('vane.Response#methodNotAllowed', '[%s] %s %s -> method not allowed.', this.peerName, this.getRequest().method, this.getRequest().path);
        this._defaultResponse(405, headers);
    },

    requestEntityTooLarge: function (headers) {
        Log.d('vane.Response#requestEntityTooLarge', '[%s] %s %s -> request entity too large.', this.peerName, this.getRequest().method, this.getRequest().path);
        this._defaultResponse(413, headers);
    },

    internalServerError: function (headers) {
        Log.d('vane.Response#internalServerError', '[%s] %s %s -> internal server error.', this.peerName, this.getRequest().method, this.getRequest().path);
        this._defaultResponse(500, headers);
    },

    requireBasicAuth: function (realm) {
        this.unauthorized({
            'WWW-Authenticate': 'Basic' + ((_.isString(realm)) ? ' realm="' + realm + '"' : '')
        });
    },

    requireDigestAuth: function (realm) {
        var nonce = CRYPTO.createHash('sha256').update(UTIL.format('%d:%s', (new Date()).getTime(), _privateKey)).digest('hex');

        this.unauthorized({
            'WWW-Authenticate': 'Digest qop="auth",nonce="' + nonce + '"'
                                    + ((_.isString(realm)) ? ',realm="' + realm + '"' : '')
        });
    },

    write: function (object, encoding) {
        if (typeof object === 'string')
            this._nresp.write(object, encoding);
        else if (object instanceof Buffer)
            this._nresp.write(object);
        else
            this._nresp.write(JSON.stringify(object), encoding);
    },

    writeHead: function (statusCode, headers) {
        this._nresp.writeHead(statusCode, headers);
    },

    end: function (object, encoding) {
        var self = this;

        if (arguments.length > 0)
            this.write(object, encoding)
        this._nresp.end();

        process.nextTick(function () {
            self.emit('end', self);
        });
    },

    endHead: function (statusCode, headers) {
        this.writeHead(statusCode, headers);
        this.end();
    },

    setCookie: function (name, value) {
        var cookie;

        if (_.isObject(name) || !name) {
            cookie = name;
        } else {
            cookie = {};
            cookie[name] = value
        }

        if (_.isEmpty(cookie))
            return ;

        var values = [];

        _.each(cookie, function (value, name) {
            values.push(name + ((value !== null && value !== undefined) ? '=' + value : ''));
        });
        if (values.length > 0)
            this.setHeader('Set-Cookie', values.join('; '));
    },

    getHeader: function (name) {
        return this._nresp.getHeader(name.toLowerCase());
    },

    hasHeader: function (name) {
        return (this.getHeader(name) !== undefined);
    },

    removeHeader: function (name) {
        this._nresp.removeHeader(name);
    },

    setHeader: function (name, value) {
        this._nresp.setHeader(name, value);
    },

    getHeaders: function () {
        var headers = {};

        _.each(this._nresp._headers, function (value, name) {
            headers[this._headerNames[name]] = value;
        }, this._nresp);
        return headers;
    },

    addHeaders: function (headers) {
        _.each(headers, function (value, name) {
            this.setHeader(name, value);
        }, this);
    },

    removeHeaders: function () {
        if (arguments.length > 0)
        {
            _.each(arguments, function (name) {
                this.removeHeader(name);
            }, this);
        }
        else
        {
            _.each(this.getHeaders(), function (value, name) {
                this.removeHeader(name);
            }, this);
        }
    },

    setHeaders: function (headers) {
        this.removeHeaders();
        this.addHeaders(headers);
    },

    getRequest: function () {
        return (this._nreq && this._nreq._vaneRequest) || null;
    },

    getStatusCode: function () {
        return this._nresp.statusCode;
    },

    setStatusCode: function (statusCode) {
        this._nresp.statusCode = statusCode;
    },

    getStatusDescription: function () {
        return HTTP.STATUS_CODES[this.getStatusCode()];
    },

    _defaultResponse: function (statusCode, headers) {
        this.writeHead(statusCode, {
            'Content-Type': 'text/html'
        });
        this.end(UTIL.format('<html><head><title>%d %s</title></head><body><h1>Error %d</h1><p>%s</p></body></html>',
            statusCode, HTTP.STATUS_CODES[statusCode], statusCode, HTTP.STATUS_CODES[statusCode]));
    }

});