var vane = {
    _                   : require('underscore'),
    Jogger              : require('jogger'),

    version             : '0.0.0',

    Application         : require('./application'),
    Assets              : require('./assets'),
    BodyParser          : require('./body_parser'),
    Controller          : require('./controller'),
    ControllerFactory   : require('./controller_factory'),
    Request             : require('./request'),
    Response            : require('./response'),
    Route               : require('./route'),
    Router              : require('./router'),
    View                : require('./view'),
    ViewFactory         : require('./view_factory'),

    inherits            : require('./inherits'),

    start: function (applicationPath, options) {
        var app;

        app = new vane.Application(applicationPath || process.cwd(), options);
        app.start();
        return app;
    }

};

global.vane = module.exports = vane;
