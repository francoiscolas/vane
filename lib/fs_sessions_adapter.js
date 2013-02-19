var _               = require('underscore');
var FS              = require('fs');
var PATH            = require('path');
var Session         = require('./session');
var SessionsAdapter = require('./sessions_adapter');
var serie           = require('./serie');

var FsSessionsAdapter = SessionsAdapter.extend({

    initialize: function () {
        this.sessionsDir = PATH.join(this.application.tmpDir, 'sessions');

        if (FS.existsSync(this.sessionsDir) === false)
            FS.mkdirSync(this.sessionsDir, 0700);
    },

    create: function (sessionId, request, response, callback) {
        if (sessionId === undefined) {
            this._generateSessionId(function (error, sessionId) {
                if (error)
                    callback(error, null)
                else
                    this.load(sessionId, request, response, callback);
            });
        } else {
            this.load(sessionId, request, response, callback);
        }
    },

    load: function (sessionId, request, response, callback) {
        var self = this;
        var path = PATH.join(self.sessionsDir, sessionId);

        serie(function (next) {
            FS.exists(path, function (exists) {
                next(null, exists);
            });
        }, function (exists, next) {
            if (exists)
                FS.readFile(path, 'UTF-8', next);
            else
                next(null, {});
        }, function (error, data) {
            if (error) {
                callback(error, null);
            } else {
                var session = new Session(sessionId, {
                    adapter : self,
                    request : request,
                    response: response
                });

                if (data)
                    session.set(JSON.parse(data));
                callback(null, session);
            }
        });
    },

    save: function (session, callback) {
        var path = PATH.join(this.sessionsDir, session.id);
        var data = JSON.stringify(session.toJSON());

        if (session && session.id)
            FS.writeFile(path, data, 'UTF-8', callback);
    },

    destroy: function (session, callback) {
        var session_id = session.id;
        var path       = PATH.join(this.sessionsDir, session_id);

        session.id = null;
        session.request.session = null;
        session.request = null;
        session.response = null;
        FS.unlink(path, callback);
    },

    purge: function (expires) {
        var self = this;

        FS.readdir(self.sessionsDir, function (error, files) {
            _.each(files, function (sessionId) {
                var path = PATH.join(self.sessionsDir, sessionId);

                FS.stat(path, function (error, stats) {
                    if (stats !== null && stats.mtime.getTime() <= expires) {
                        FS.unlink(path, function () {
                            log.d('removed session "%s"', sessionId);
                        });
                    }
                });
            });
        });
    },

    _generateSessionId: function (callback) {
        var session_id = (function () {
            var session_id = '';
            var chars      = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

            for (var i = 0; i < 64; i++)
                session_id += chars[Math.round(Math.random() * (chars.length - 1))];
            return session_id;
        })();
        var path = PATH.join(this.sessionsDir, session_id);
        var self = this;

        FS.stat(path, function (error, stats) {
            if (error !== null) {
                FS.writeFile(path, '', function (error) {
                    if (error !== null)
                        callback.call(self, error, null);
                    else
                        callback.call(self, null, session_id);
                });
            } else {
                self._generateSessionId(callback);
            }
        });
    }

});

module.exports = FsSessionsAdapter;

