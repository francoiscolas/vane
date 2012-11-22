var AbstractSessionFactory = function (application) {
    this.application = application;
    this.application.on('started', this._onApplicationStarted, this);
    this.application.on('stopped', this._onApplicationStopped, this);

    this.initialize.apply(this, arguments);
};

AbstractSessionFactory.extend = require('./inherits');

AbstractSessionFactory.prototype = {

    initialize: function () {
    },

    create: function (request, response, callback) {
    },

    purge: function () {
    },

    _startPurgeTimer: function () {
        var self = this;
        self.purge.timer = setInterval(function () { self.purge.call(self); }, 60 * 60 * 1000);
    },

    _stopPurgeTimer: function () {
        clearInterval(this.purge.timer);
    },

    _onApplicationStarted: function () {
        this._startPurgeTimer();
    },

    _onApplicationStopped: function () {
        this._stopPurgeTimer();
    }

};

module.exports = AbstractSessionFactory;
