var SessionsAdapter = function (factory) {
    this.factory     = factory;
    this.application = factory.application;
    this.initialize.apply(this, arguments);
};

SessionsAdapter.extend = require('./inherits');

SessionsAdapter.prototype = {
    initialize: function (factory) {
    },
    create: function (sessionId, request, response, callback) {
        callback(new Error('Not implemented'), null);
    },
    save: function (session, callback) {
        callback(new Error('Not implemented'), null);
    },
    destroy: function (session, callback) {
        callback(new Error('Not implemented'), null);
    },
    purge: function (expires) {
    }
};

module.exports = SessionsAdapter;
