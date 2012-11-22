var vane = module.exports = {
    _                   : require('underscore'),
    Jogger              : require('jogger'),

    version             : '0.0.0',

    Application         : require('./application'),
    Assets              : require('./assets'),
    BodyParser          : require('./body_parser'),
    Controller          : require('./controller'),
    ControllerFactory   : require('./controller_factory'),
    Log                 : require('./log'),
    Request             : require('./request'),
    Response            : require('./response'),
    Route               : require('./route'),
    Router              : require('./router'),
    View                : require('./view'),
    ViewFactory         : require('./view_factory'),

    inherits            : require('./inherits')
};
