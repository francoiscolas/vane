var _                 = require('underscore');
var FS                = require('fs');
var PATH              = require('path');

var Assets            = require('./assets');
var ControllerFactory = require('./controller_factory');
var Events            = require('./events');
var I18n              = require('./i18n');
var Router            = require('./router');
var Server            = require('./server');
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
    this.i18n        = new I18n(this, this.i18n);

    this.router      = new Router(this);
    this.sessions    = new SessionFactory(this);
    this.server      = new Server(this, this.server);

};

Application.Environement = {
    PRODUCTION : 'production',
    DEVELOPMENT: 'development'
};

_.extend(Application.prototype, Events, {

    start: function (callback) {
        this.server.start(callback);
    },

    stop: function (callback) {
        this.server.stop(callback);
    },

    isDevelopment: function () {
        return (this.environment !== Application.Environement.PRODUCTION);
    },

    isProduction: function () {
        return (this.environment === Application.Environement.PRODUCTION);
    }

});

module.exports = Application;
