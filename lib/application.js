var _                 = require('underscore');
var FS                = require('fs');
var HTTP              = require('http');
var PATH              = require('path');
var VA                = require('va');

var Assets            = require('./assets');
var ControllerFactory = require('./controller_factory');
var Events            = require('./events');
var Log               = require('./log');
var Request           = require('./request');
var Response          = require('./response');
var Router            = require('./router');
var SessionFactory    = require('./session_factory');
var ViewFactory       = require('./view_factory');

var Application = function () {
    if (FS.existsSync(this.tmpDir) === false)
        FS.mkdirSync(this.tmpDir, 0700);

    Log.level = (this.isProduction()) ? Log._class.Level.i : Log._class.Level.d;
    Log.outputs.push(FS.createWriteStream(PATH.join(this.tmpDir, this.environnement + '.log'), {flags: 'a'}));

    this.assets      = new Assets(this);
    this.controllers = new ControllerFactory(this);
    this.views       = new ViewFactory(this);

    this.router      = new Router(this);
    this.sessions    = new SessionFactory(this);

    this.initialize.apply(this, arguments);
};

Application.Environnement = {
    PRODUCTION : 'production',
    DEVELOPMENT: 'development'
};

Application.extend = require('./inherits');

_.extend(Application.prototype, Events, {

    environnement: process.env.VANE_ENV || process.env.NODE_ENV || Application.Environnement.DEVELOPMENT,

    initialize: function (options) {
    },

    start: function (port, host, options, callback) {
        with (VA(arguments, 'number port', 'string host=', 'object options=', 'function callback='))
        {
            var self = this;

            if (self._server === undefined)
                self._server = new HTTP.createServer(_.bind(self._handleRequest, self));

            self._server.listen(port, host || '0.0.0.0', function () {
                Log.i('vane', 'server started on %s:%d', self._server.address().address, self._server.address().port);
                self.trigger('started', self);

                callback && callback.apply(null, arguments);
            });
        };
    },

    stop: function (callback) {
        var self = this;

        self._server.stop(function () {
            Log.i('vane', 'server stopped');
            self.trigger('stopped', self);

            callback && callback.apply(null, arguments);
        });
    },

    isDevelopment: function () {
        return (this.environnement !== Application.Environnement.PRODUCTION);
    },

    isProduction: function () {
        return (this.environnement === Application.Environnement.PRODUCTION);
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
            Log.i('vane', '%s "%s" "%s %s HTTP/%s" -> %d %s.', request.peerAddress, request.getHeader('User-Agent'), request.method, request.path, request.httpVersion, response.getStatusCode(), response.getStatusDescription());
        });

        if (this.router.handleRequest(request, response) === false)
            this._handle404(request, response);
    },

    _handle404: function (request, response) {
        response.notFound();
    }

});

module.exports = Application;
