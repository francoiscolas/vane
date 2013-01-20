var _    = require('underscore');
var UTIL = require('util');

var Logger = function (options) {
    var self = this;

    _.extend(self, {
        outputs : [process.stdout],
        filter  : null,
        level   : Logger.Level.d,
        port    : 0,
        _class  : Logger,
        _server : null
    }, options);

    self.setPort(self.port);

    process.on('uncaughtException', function (error) {
        self.e('Error: %s', error.stack || error);
    });
};

Logger.Level = {
    none: 0,
    e   : 1,
    w   : 2,
    i   : 3,
    d   : 4
};

Logger.Color = {
    e: 31,
    w: 33,
    i: 36
};

Logger.prototype = {

    e: function (format/*, arguments*/) {
        this._write.apply(this, ['e'].concat(Array.prototype.slice.call(arguments, 0)))
    },

    w: function (format/*, arguments*/) {
        this._write.apply(this, ['w'].concat(Array.prototype.slice.call(arguments, 0)))
    },

    i: function (format/*, arguments*/) {
        this._write.apply(this, ['i'].concat(Array.prototype.slice.call(arguments, 0)))
    },

    d: function (format/*, arguments*/) {
        this._write.apply(this, ['d'].concat(Array.prototype.slice.call(arguments, 0)))
    },

    setPort: function (port) {
        if (this._server !== null) {
            this._server.close();

            delete this._server;
            this._server = null;
        }
        if (port > 0) {
            this.port = port;

            this._server = NET.createServer(this._onConnection.bind(this));
            this._server.listen(this.port, '127.0.0.1');
        }
    },

    _now: function () {
        var now = new Date();
        return now.getFullYear() + '-' + this._pad(now.getMonth(), 2) + '-' + this._pad(now.getDate(), 2)
            + ' ' + this._pad(now.getHours(), 2) + ':' + this._pad(now.getMinutes(), 2) + ':' + this._pad(now.getSeconds(), 2) + '.' + this._pad(now.getMilliseconds(), 3);
    },

    _pad: function (string, width) {
        var padded = '' + string;

        while (padded.length < width)
            padded = '0' + padded;
        return padded;
    },

    _write: function (type, format/*, arguments...*/) {
        if (this.level < Logger.Level[type])
            return ;

        if (this.filter && !this.filter.test(tag))
            return ;

        var matches = (new Error()).stack.split('\n')[3].match(/.*\/(.*):([0-9]+):[0-9]+/);
        var file    = (matches && matches[1]) || '<unknown>';
        var line    = (matches && matches[2]) || '?';

        var args    = [this._now() + ' ' + type.toUpperCase() + '/' + file + ':' + line + ' ' + format].concat(
            Array.prototype.slice.call(arguments, 2));
        var data    = UTIL.format.apply(UTIL, args);

        this.outputs.forEach(function (wstream) {
            if (wstream.isTTY && Logger.Color[type] !== undefined) {
                wstream.write('\033[' + Logger.Color[type] + 'm' + data + '\033[0m\n');
            } else {
                wstream.write(data + '\n');
            }
        });
    },

    _onConnection: function (socket) {
        var self = this;

        socket.setEncoding('UTF-8');
        socket.on('data', function (data) {
            var cmd = data.trim().substring(0, data.indexOf(' '));
            var arg = data.trim().substring(cmd.length + 1);

            switch (cmd)
            {
                case 'filter':
                    self.filter = (arg) ? new RegExp(arg) : null;
                case 'level':
                    if (typeof Jogger.Level[arg] !== 'undefined')
                        self.level = Jogger.Level[arg];
                    break;
            }
        });
    }

};

global.log = module.exports = Logger;
