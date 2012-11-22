var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var AbstractSessionFactory  = require('./abstract_session_factory');
var Log                     = require('./log');
var Session                 = require('./session');

var SessionFactory = AbstractSessionFactory.extend({

    initialize: function () {
        AbstractSessionFactory.prototype.initialize.apply(this, arguments);

        this.cookieName      = 'SID';
        this.maxInactiveTime = 12 * 60 * 60 * 1000; // 12h
        this.sessionsDir     = PATH.join(this.application.tmpDir, 'sessions');

        if (FS.existsSync(this.sessionsDir) === false)
            FS.mkdirSync(this.sessionsDir, 0700);
    },

    create: function (request, response, callback) {
        var session_id;

        if (_.isEmpty((session_id = request.cookies[this.cookieName])))
            this._new(request, response, callback);
        else
            this._load(request, response, session_id, callback);
    },

    save: function (session, callback) {
        if (session.id) {
            var path = PATH.join(this.sessionsDir, session.id);

            FS.writeFile(path, JSON.stringify(session.attributes), 'UTF-8', function (error) {
                if (error !== null)
                    Log.e('vane', "Error saving session '%s' (%s).", session.id, error.message);
                callback && callback();
            });
        } else {
            Log.w('vane', "Can't save session because session's id is undefined.");
        }
    },

    destroy: function (session, callback) {
        var session_id = session.id;
        var path       = PATH.join(this.sessionsDir, session_id);

        FS.unlink(path, function (error) {
            if (error !== null)
                Log.e('vane', 'error destroying session %s (%s)', session_id, error.message);
            callback && callback();
        });

        session.id = null;
        session._request.session = null;
        session._request = null;
        session._response.setCookie(this.cookieName, '');
        session._response = null;
        delete session;
    },

    _load: function (request, response, sessionId, callback) {
        var self = this;
        var path = PATH.join(this.sessionsDir, sessionId);

        FS.readFile(path, 'UTF-8', function (error, data) {
            callback(new Session(sessionId, (data) ? JSON.parse(data) : {}, {
                _request : request,
                _response: response,
                _factory : self
            }));
        });
    },

    _new: function (request, response, callback) {
        this._generateSessionId(function (error, sessionId) {
            if (error !== null) {
                Log.e('vane', 'error creating new session (%s)', error.message);
                response.internalServerError();
            } else {
                var cookie = {};

                cookie[this.cookieName] = sessionId;
                cookie['HttpOnly'] = null;
                cookie['Path'] = '/';
                if (request.connection.encrypted)
                    cookie['Secure'] = null;
                response.setCookie(cookie);

                callback(new Session(sessionId, {}, {
                    _request : request,
                    _response: response,
                    _factory : this
                }));
            }
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
    },

    purge: function () {
        var self    = this;
        var expires = Date.now() - self.maxInactiveTime;

        Log.d('vojo.Session._checkSessions', 'checking sessions life time...');
        FS.readdir(self.sessionsDir, function (error, files) {
            _.each(files, function (filename) {
                var file = PATH.join(self.sessionsDir, filename);

                FS.stat(file, function (error, stats) {
                    if (stats !== null && stats.mtime.getTime() <= expires) {
                        FS.unlink(file, function () {
                            Log.d('vane', 'removed session "%s"', filename);
                        });
                    }
                });
            });
        });
    }

});

module.exports = SessionFactory;
