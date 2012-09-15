var _    = require('underscore');
var HTTP = require('http');
var UTIL = require('util');

var Log      = require('./log');
var Request  = require('./request');
var Response = require('./response');

var Server = module.exports = function (application, options) {
    this.application = application;
    this.handlers    = [];
    this.httpServer  = null;
    this.host        = Server.DEFAULT_HOST;
    this.port        = Server.DEFAULT_PORT;
    this._configure(options);
};

Server.DEFAULT_HOST = 'localhost';

Server.DEFAULT_PORT = 8080;

Server.prototype = {

    start: function (callback) {
        var self = this;

        if (self.httpServer === null)
        {
            self.httpServer = new HTTP.createServer();
            self.httpServer.listen(self.port, self.host, function () {
                Log.i('vane.Server#start', 'Listening on %s:%d.', self.host, self.port);
                callback && callback(null);
            });
        }
        else
        {
            callback && callback(null);
        }
        self.httpServer.on('request', function () {
            self._onRequest.apply(self, arguments);
        });
    },

    stop: function (callback) {
        if (this.httpServer !== null) {
            this.httpServer.close(callback);
            this.httpServer = null;
        } else {
            callback && callback();
        }
    },

    restart: function (callback) {
        var self = this;

        self.stop(function () {
            self.start(callback);
        });
    },

    addHandler: function (handler) {
        if (typeof handler === 'function')
            this.handlers.push(handler);
    },

    removeHandler: function (handler) {
        var i;

        if ((i = this.handlers.indexOf(handler)) >= 0)
            this.handlers.splice(i, 1);
    },

    getHandlers: function () {
        return this.handlers.slice(0);
    },

    setHandlers: function (handlers) {
        this.handlers = handlers;
    },

    _configure: function (options) {
        _.extend(this, options);
    },

    _onRequest: function (nreq, nresp) {
        var req  = new Request(nreq, {
            application: this.application,
            _nresp     : nresp
        });
        var resp = new Response(nresp, {
            application: this.application,
            _nreq      : nreq
        });

        Log.d('vane.Server#_onRequest', '[%s] New request to %s %s.', req.peerName, req.method, req.path);

        req.pauseDataEvent();

        resp.setHeaders({
            'Content-Type': 'text/html; charset=utf-8',
            'Date'        : new Date()
        });
        resp.on('end', function (resp) {
            Log.d('vane.Server#_onRequest', '[%s] Request done with status code %d.', req.peerName, resp.getStatusCode());
            Log.i('vane.Server#_onRequest', '[%s] - %s - "%s %s HTTP/%s" -> %d %s - "%s".', req.peerName, resp.getHeader('Date'), req.method, req.path, req.httpVersion, resp.getStatusCode(), resp.getStatusDescription(), req.getHeader('User-Agent'));
        });

        var self = this;
        var i    = 0;

        (function () {
            if (i < self.handlers.length)
                return self.handlers[i++](req, resp, arguments.callee);
            self._on404NotFound(req, resp);
        })();
    },

    _on404NotFound: function (req, resp) {
        resp.writeHead(404, {
            'Content-Type': 'text/html'
        });
        resp.end(UTIL.format('<html><head><title>%d %s</title></head><body><h1>Error %d</h1><p>%s</p></body></html>',
            404, HTTP.STATUS_CODES[404], 404, HTTP.STATUS_CODES[404]));
    }

};
