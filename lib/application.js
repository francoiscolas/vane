var _                 = require('underscore');
var FS                = require('fs');
var HTTP              = require('http');
var PATH              = require('path');
var NODE_STATIC       = require('node-static');

var Assets            = require('./assets');
var ControllerFactory = require('./controller_factory');
var Events            = require('./events');
var I18n              = require('./i18n');
var Request           = require('./request');
var Response          = require('./response');
var Router            = require('./router');
var SessionFactory    = require('./session_factory');
var ViewFactory       = require('./view_factory');

var Application = function (applicationPath, options) {
    if (!options) options = {};

    this.environment   = process.env.VANE_ENV || process.env.NODE_ENV || Application.Environement.DEVELOPMENT;
    this.rootDir       = PATH.normalize(applicationPath);
    this.configDir     = PATH.join(applicationPath, 'config');
    this.publicDir     = PATH.join(applicationPath, 'public');
    this.tmpDir        = PATH.join(applicationPath, 'tmp');
    _.extend(this, options);

    if (FS.existsSync(this.tmpDir) === false)
        FS.mkdirSync(this.tmpDir, 0700);

    log.level = (this.isProduction()) ? log._class.Level.i : log._class.Level.d;
    log.outputs.push(FS.createWriteStream(PATH.join(this.tmpDir, this.environment + '.log'), {flags: 'a'}));

    _.extend(this, require(PATH.join(this.configDir, 'environments', this.environment)));

    this.assets      = new Assets(this);
    this.controllers = new ControllerFactory(this);
    this.views       = new ViewFactory(this);
    this.i18n        = new I18n(this);

    this.router   = new Router(this, options.router);
    this.sessions = new SessionFactory(this);

    this._server      = null;
    this._staticFiles = null;

};

Application.Environement = {
    PRODUCTION : 'production',
    DEVELOPMENT: 'development'
};

Application.DEFAULT_PORT = 8080;

Application.DEFAULT_HOST = '127.0.0.1';

_.extend(Application.prototype, Events, {

    start: function (callback) {
        this._callInitializers(function (error) {
            if (error) {
                log.e('error while calling initializers: %s', error.stack || error);
                callback && callback(error);
            } else {
                this._startServer(callback);
            }
        });
    },

    stop: function (callback) {
        this._stopServer(callback);
    },

    isDevelopment: function () {
        return (this.environment !== Application.Environement.PRODUCTION);
    },

    isProduction: function () {
        return (this.environment === Application.Environement.PRODUCTION);
    },

    _callInitializers: function (callback) {
        var self         = this;
        var path         = PATH.join(self.configDir, 'initializers');
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
                callback && callback.call(self, null);
            } else {
                var initializer = require(PATH.join(path, initializers[i]));

                if (typeof initializer === 'function')
                    initializer(self, done);
                else
                    done(null);
            }
        };

        next();
    },

    _startServer: function (callback) {
        var self = this;
        var port = (_.isNumber(self.port)) ? self.port : Application.DEFAULT_PORT;
        var host = (_.isString(self.host)) ? self.host : Application.DEFAULT_HOST;

        self._server = new HTTP.createServer(self._handleRequest.bind(self));
        self._server.listen(port, host, function () {
            log.i('server started on %s:%d', host, port);
            callback && callback.apply(self, arguments);
        });
    },

    _stopServer: function (callback) {
        if (this._server) {
            this._server.close(callback);
            this._server = null;
        }
    },

    _handleRequest: function (nodeRequest, nodeResponse) {
        var request = new Request(nodeRequest, {
            application : this,
            nodeResponse: nodeResponse
        });
        var response = new Response(nodeResponse, {
            application: this,
            nodeRequest: nodeRequest
        });

        response.on('end', function (response) {
            log.i('%s "%s" "%s %s HTTP/%s" -> %d %s.', request.peerAddress, request.getHeader('User-Agent'), request.method, request.path, request.httpVersion, response.getStatusCode(), response.getStatusDescription());
        });

        if (this.router.handleRequest(request, response) === false) {
            if (this.isDevelopment()) {
                if (this._staticFiles === null)
                    this._staticFiles = new NODE_STATIC.Server(this.publicDir);
                this._staticFiles.serve(nodeRequest, nodeResponse);
            } else {
                response.notFound();
            }
        }
    }

});

module.exports = Application;
