var vane = module.exports = {
    _                   : require('underscore'),
    Jogger              : require('jogger'),

    Application         : require('./application'),
    Assets              : require('./assets'),
    BodyParser          : require('./body_parser'),
    Controller          : require('./controller'),
    ControllerFactory   : require('./controller_factory'),
    Database            : require('./database'),
    Log                 : require('./log'),
    Model               : require('./model'),
    Request             : require('./request'),
    Response            : require('./response'),
    Route               : require('./route'),
    Router              : require('./router'),
    Server              : require('./server'),
    View                : require('./view'),
    ViewFactory         : require('./view_factory'),

    inherits            : require('./inherits'),
    serie               : require('./serie')
};
