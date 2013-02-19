var _                 = require('underscore');
var FsSessionsAdapter = require('./fs_sessions_adapter');

var SessionFactory = function (application, options) {
    this.application = application;
    this.application.on('started', this._onApplicationStarted, this);
    this.application.on('stopped', this._onApplicationStopped, this);

    _.defaults(this, options, {
        adapter        : new FsSessionsAdapter(this),
        cookieName     : 'SID',
        maxInactiveTime: 12 * 60 * 60 * 1000 // 12h
    });
};

SessionFactory.prototype = {

    create: function (request, response, callback) {
        var session_id = request.cookies[this.cookieName];
        this.adapter.create(session_id, request, response, callback);
    },

    purge: function () {
        this.adapter.purge(Date.now() - this.maxInactiveTime);
    },

    _onApplicationStarted: function () {
        this.purge._timer = setInterval(this.purge.bind(this));
    },

    _onApplicationStopped: function () {
        clearInterval(this.purge._timer);
        this.purge();
    }

};

module.exports = SessionFactory;
