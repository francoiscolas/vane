var _           = require('underscore');
var CRYPTO      = require('crypto');
var EVENTS      = require('events');
var URL         = require('url');

var BodyParser  = require('./body_parser');
var Log         = require('./log');
var Session     = require('./session');

var Request = module.exports = function (nodeRequest, options) {
    EVENTS.EventEmitter.call(this);

    var self       = this;
    var parsed_url = URL.parse(nodeRequest.url, true);

    self.application = (options && options.application) || null;

    self.connection = nodeRequest.connection;

    self.cookies = (function () {
        var cookies = {};

        if (nodeRequest.headers['cookie']) {
            var array = nodeRequest.headers['cookie'].split(';');

            for (var i = 0; i < array.length; i++) {
                var tokens = array[i].split('=');

                if (tokens.length === 2)
                    cookies[tokens[0]] = tokens[1];
            }
        }
        return cookies;
    })();

    self.expect100Continue = false;

    self.hasBody = BodyParser.hasBody(nodeRequest);

    self.headers = nodeRequest.headers;

    self.httpVersion = nodeRequest.httpVersion;
    self.httpVersionMajor = +nodeRequest.httpVersionMajor;
    self.httpVersionMinor = +nodeRequest.httpVersionMinor;

    self.isBodyParsed = false;

    self.isDataEventEmitted = false;
    self.isDataEventPaused = false;

    self.isEndEventEmitted = false;

    self.method   = nodeRequest.method;
    self.isHEAD   = (self.method === 'HEAD');
    self.isGET    = (self.method === 'GET');
    self.isPOST   = (self.method === 'POST');
    self.isPUT    = (self.method === 'PUT');
    self.isDELETE = (self.method === 'DELETE');

    self.params = {
        path : {},
        query: parsed_url.query,
        body : {}
    };

    self.path = decodeURI(parsed_url.pathname);

    self.peerAddress = self.connection.remoteAddress;
    self.peerPort    = self.connection.remotePort;
    self.peerName    = self.peerAddress + ':' + self.peerPort;

    self.query = parsed_url.search;

    self.session = null;

    self.url = nodeRequest.url;

    self.nodeRequest = nodeRequest;
    self.nodeRequest._vaneRequest = self;
    self.nodeRequest.on('data', function (data) {
        self._onData(data);
    });
    self.nodeRequest.on('end', function () {
        self.isEndEventEmitted = true;
        self.emit('end');
    });
    self.nodeRequest.on('close', function () {
        self.emit('close');
    });

    self.nodeResponse = (options && options.nodeResponse) || null;
};

var _noop = function () {
};

_.extend(Request.prototype, EVENTS.EventEmitter.prototype, {

    parseBasicAuth: function () {
        var authorization;

        if ((authorization = this.headers['authorization']) !== undefined) {
            var matches;

            if ((matches = authorization.match(/^ *Basic *([0-9A-Za-z=]+) *$/)) !== null) {
                var base64 = matches[1];
                var tokens = (new Buffer(base64, 'base64')).toString('ascii').split(':');

                if (tokens.length == 2) {
                    return {
                        username: tokens[0],
                        password: tokens[1]
                    }
                }
            }
        }
        return null;
    },

    parseDigestAuth: function (callback) {
        var authorization;

        if (typeof callback !== 'function')
            throw new Error('First parameter must be a function.');

        if ((authorization = this.headers['authorization']) !== undefined) {
            var matches;

            if ((matches = authorization.match(/^ *Digest *(.*) *$/)) !== null) {
                var tokens = matches[1].split(/, */);
                var values = {};

                for (var i = 0; i < tokens.length; i++) {
                    var matches = tokens[i].match(/([0-9A-Za-z]+)=(?:"?([0-9A-Za-z()-\/]*)"?)/);
                    values[matches[1]] = matches[2];
                }
                if (values.username === undefined) {
                    Log.w('vane.Request#parseDigestAuth', '[%s] No "username" field found in the "Authorization" header. Discarding parse.', this.peerName);
                } else {
                    var self = this;

                    callback(values.username, function (password) {
                        var ha1			= CRYPTO.createHash('md5').update(UTIL.format('%s:%s:%s', values.username, values.realm, password)).digest('hex');
                        var ha2			= CRYPTO.createHash('md5').update(UTIL.format('%s:%s', self.method, self.url)).digest('hex');
                        var response	= CRYPTO.createHash('md5').update(UTIL.format('%s:%s:%s:%s:%s:%s', ha1, values.nonce, values.nc, values.cnonce, values.qop, ha2)).digest('hex');
                        return (values.response == response);
                    });
                    return ;
                }
            }
        }
        callback(null, _noop);
    },

    parseBody: function (options, callback) {
        if (_.isFunction(options)) {
            callback = options;
            options  = {};
        }
        return (new BodyParser(options)).parse(this, callback);
    },

    sessionStart: function (callback) {
        var self = this;

        if (self.session !== null) {
            callback && callback(self.session);
        } else {
            self.application.sessions.create(self, self.getResponse(), function (session) {
                self.session = session;
                self.getResponse().on('end', function () {
                    self.sessionStop();
                });
                callback && callback(session);
            });
        }
    },

    sessionStop: function (callback) {
        if (this.session !== null) {
            this.session.save(callback);
            this.session = null;
        }
    },

    removeUploadedFiles: function () {
        var self = this;

        self.params.body.each(function (value) {
            if (value.tmpname !== undefined
                    && value.removed !== true) {
                FS.unlink(value.tmpname, function (error) {
                    if (error !== null)
                        Log.e('vane.Request#removeUploadedFiles', '[%s] Error while removing "%s": %s.', self.peerName, tmpname, error.message);
                });
                value.removed = true;
            }
        });
    },

    pauseDataEvent: function () {
        Log.d('vane.Request#pauseDataEvent', '[%s] Pausing "data" event (pause body reads).', this.peerName);
        this.nodeRequest.pause();
        this.isDataEventPaused = true;
    },

    resumeDataEvent: function () {
        Log.d('vane.Request#resumeDataEvent', '[%s] Resuming "data" event (resume body reads).', this.peerName);

        // hack due to a bug in node
        if (this._bufferedData) {
            var bufferedData = this._bufferedData;
            var self = this;

            process.nextTick(function () {
                self.isDataEventEmitted = true;
                self.emit('data', bufferedData);

                if (self.isEndEventEmitted) {
                    process.nextTick(function () {
                        self.emit('end');
                    });
                } else {
                    self.nodeRequest.resume();
                }
                bufferedData = null;
            });
            this._bufferedData = null;
        } else {
            this.nodeRequest.resume();
        }
        this.isDataEventPaused = false;
    },

    getHeader: function (name) {
        return this.headers[name.toLowerCase()];
    },

    hasHeader: function (name) {
        return (typeof this.headers[name.toLowerCase()] !== 'undefined');
    },

    getResponse: function () {
        return (this.nodeResponse && this.nodeResponse._vaneResponse) || null;
    },

    _onData: function (data) {
        if (this.isDataEventPaused)
        {
            if (this._bufferedData)
                Log.e('vane.Request#_onData', '[%s] Please tell the developper this message pop out.', this.peerName);
            this._bufferedData = data; // hack due to a bug in node
        }
        else
        {
            this.isDataEventEmitted = true;
            this.emit('data', data);
        }
    }

});
