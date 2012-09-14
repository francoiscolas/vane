var Application = module.exports = function (options) {
    this.environnement = process.env.VANE_ENV || process.env.NODE_ENV || Application.Environnement.DEVELOPMENT;
    _.extend(this, options);

    if (this.isProduction())
        Log.level = Log._class.Level.i;

    this.server      = new Server(this, options && options.server);
    this.router      = new Router(this, options && options.router);
    this.assets      = new Assets(this, options && options.assets);
    this.database    = new Database(this, options && options.database);
    this.views       = new ViewFactory(this);
    this.controllers = new ControllerFactory(this);

    this.initialize.apply(this, arguments);

    Application.instance = this;
};

var _                 = require('underscore');
var Assets            = require('./assets');
var ControllerFactory = require('./controller_factory');
var Database          = require('./database');
var Log               = require('./log');
var Router            = require('./router');
var Server            = require('./server');
var Session           = require('./session');
var ViewFactory       = require('./view_factory');
var serie             = require('./serie');

Application.Environnement = {
    PRODUCTION : 'production',
    DEVELOPMENT: 'development'
};

Application.extend = require('./inherits');

Application.instance = null;

Application.prototype = {

    initialize: function (options) {
    },

    start: function (callback) {
        var self  = this;
        var check = function (next) {
            return function (error) {
                if (error !== null) {
                    self.stop(function () {
                        callback && callback(error);
                    });
                } else {
                    next();
                }
            };
        };

        Log.d('vane.Application#start', 'Starting application.');
        serie(function (next) {
            self.database.start(check(next));
        }, function (next) {
            Session.start(check(next));
        }, function (next) {
            self.server.start(check(next));
        }, function () {
            callback && callback(null);
        });
    },

    restart: function (callback) {
        var self = this;

        self.stop(function () {
            self.start(callback);
        });
    },

    stop: function (callback) {
        var self = this;

        Log.d('vane.Application#start', 'Stopping application.');
        serie(function (next) {
            self.server.stop(next);
        }, function (next) {
            Session.stop(next);
        }, function (next) {
            self.database.stop(next);
        }, function () {
            callback && callback();
        });
    },

    isDevelopment: function () {
        return (this.environnement !== Application.Environnement.PRODUCTION);
    },

    isProduction: function () {
        return (this.environnement === Application.Environnement.PRODUCTION);
    }

};
