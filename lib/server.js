var _           = require('underscore');
var FS          = require('fs');
var HTTP        = require('http');
var NODE_STATIC = require('node-static');
var PATH        = require('path');

var Request  = require('./request');
var Response = require('./response');

var Server = function (application, options) {
    this.application      = application;
    this.initialized      = false;
    this.host             = '127.0.0.1';
    this.port             = 8080;
    this.servePublicDir   = true;
    this.maxContentLength = 2 * 1024 * 1024;
    this.uploadDir        = PATH.join(application.tmpDir, 'uploads');
    this._server          = null;
    this._staticFiles     = null;
    _.extend(this, options);
};

Server.prototype = {

    initialize: function (callback) {
        var self         = this;
        var path         = PATH.join(self.application.configDir, 'initializers');
        var initializers = FS.readdirSync(path).filter(function (initializer) { return initializer[0] !== '.'; }).sort();
        var i            = -1;

        var done = function (error) {
            if (error)
                callback && callback.call(self, error);
            else
                next();
        };

        var next = function () {
            if (++i >= initializers.length) {
                self.initialized = true;
                callback && callback.call(self, null);
            } else {
                var initializer = require(PATH.join(path, initializers[i]));

                if (typeof initializer === 'function')
                    initializer(self.application, done);
                else
                    done(null);
            }
        };

        next();
    },

    start: function (callback) {
        var self = this;

        if (self.initialized === false) {
            self.initialize(function (error) {
                if (error) {
                    log.e('Error while calling initializers: %s.', error.stach || error);
                    callback && callback.apply(self, arguments);
                } else {
                    self.start(callback);
                }
            });
        } else {
            var port = (_.isNumber(self.application.port)) ? self.application.port : Application.DEFAULT_PORT;
            var host = (_.isString(self.application.host)) ? self.application.host : Application.DEFAULT_HOST;

            self._server = new HTTP.createServer(self._onHttpRequest.bind(self));
            self._server.listen(port, host, function () {
                log.i('HTTP server started on %s:%d.', host, port);
                log.i('Application is running in %s environment.', self.application.environment);
                self.application.emit('started', self.application);
                callback && callback.apply(self, arguments);
            });
        }
    },

    stop: function (callback) {
        var self = this;

        self._server.close(function () {
            log.i('HTTP server stopped.');
            self.application.emit('stopped', self.application);
            callback && callback.apply(self, arguments);
        });
        self._server = null;
    },

    _onHttpRequest: function (nodeRequest, nodeResponse) {
        var self = this;
        var request = new Request(nodeRequest, {
            application : self.application,
            nodeResponse: nodeResponse
        });
        var response = new Response(nodeResponse, {
            application: self.application,
            nodeRequest: nodeRequest
        });

        request.once('error', function (error) {
            self._errorHandler(request, response, error);
        });

        response.once('end', function () {
            log.i('%s "%s" "%s %s HTTP/%s" -> %d %s.', request.peerAddress, request.getHeader('User-Agent'), request.method, request.path, request.httpVersion, response.getStatusCode(), response.getStatusDescription());
        });

        if (request.hasBody)
            request.once('body', self._mainHandler.bind(self, request, response));
        else
            self._mainHandler(request, response);
    },

    _mainHandler: function (request, response) {
        if (this.application.router.handle(request, response))
            return ;

        if (this.servePublicDir) {
            if (this._staticFiles === null)
                this._staticFiles = new NODE_STATIC.Server(this.application.publicDir);
            this._staticFiles.serve(request.nodeRequest, response.nodeResponse, function (error) {
                if (error)
                    request.emit('error', _.extend(new Error(error.message), {statusCode: error.status}));
            });
        } else {
            request.emit('error', 404);
        }
    },

    _errorHandler: function (request, response, error) {
        var statusCode;
        var message;
        var stack;
        
        if (isNaN(+error)) {
            statusCode = (error && error.statusCode) || 500;
            message = (error && error.message) || HTTP.STATUS_CODES[statusCode];
            stack = (error && (error.stack || error)) || (new Error()).stack;
        } else {
            statusCode = error;
            message = HTTP.STATUS_CODES[statusCode];
            stack = (new Error()).stack;
        }

        response.writeHead(statusCode, {
            'Content-Type': 'text/html'
        });
        response.end(_.template([
            '<!doctype html>',
            '<html>',
                '<head>',
                    '<title>Error: <%= statusCode + " " + message %></title>',
                '</head>',
                '<body>',
                    '<h1><%= message %></h1>',
                    '<% if (stack) { %>',
                        '<pre><%= stack %></pre>',
                    '<% } %>',
                '</body>',
            '</html>'
        ].join(''), {
            statusCode: statusCode,
            message   : message,
            stack     : stack
        }));

        log.e('[%s] %s', request.peerName, stack);
    }

};

module.exports = Server;
