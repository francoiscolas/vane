var _           = require('underscore');
var QUERYSTRING = require('querystring');

var Log         = require('./log');

var BodyParser = function (options) {
    this.maxContentLength = undefined;
    this.uploadDir        = BodyParser.DEFAULT_UPLOAD_DIR;
    _.extend(this, options);
};

BodyParser.DEFAULT_UPLOAD_DIR = require('os').tmpDir();

BodyParser.hasBody = function (request) {
    return !!(request && request.headers && request.headers['content-type'] && request.headers['content-length']);
};

BodyParser.uniqueId = function () {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var id    = '';

    for (var i = 0; i < 32; i++)
        id += chars[Math.round(Math.random() * (chars.length - 1))];
    return id;
};

BodyParser.Parsers = {
    'application/x-www-form-urlencoded': function (matches, request, callback) {
        var content = '';

        if (request.isDataEventEmitted)
            return callback(new Error('Body already read.'), null);

        if (request.isDataEventPaused)
            request.resumeDataEvent();

        request.on('data', function (data) {
            content += data;
        });
        request.once('end', function () {
            request.isBodyParsed = true;
            request.params.body = QUERYSTRING.parse(content);
            callback(null, request.params.body);
        });
    },
    'application/json': function (matches, callback) {
//        var that    = this;
//        var content = '';
//
//        if (this.req.isDataEventEmitted)
//        {
//            Log.w('vojo.BodyParser.parsers[application/json]', 'body data already read - stop parsing');
//            return ;
//        }
//
//        if (this.req.isDataEventPaused)
//            this.req.resumeDataEvent();
//
//        this.req.on('data', function (data) {
//            content += data;
//        });
//        this.req.once('end', function () {
//            that.req.isBodyParsed = true;
//            that.req.params.body = JSON.parse(content);
//            callback.call(null, null, that.req.params.body);
//        });
    },
    'multipart/form-data; boundary=(.+)': function (matches, callback) {
//        var that    = this;
//        var param   = {name: null, type: null, value: null};
//        var parser  = new MultipartFormDataParser(matches[1]);
//
//        if (this.req.isDataEventEmitted)
//        {
//            Log.w('vojo.BodyParser.parsers[multipart/form-data; boundary=(.+)]', 'body data already read - stop parsing');
//            return ;
//        }
//
//        var ParameterType = {
//            File: 'File',
//            Raw : 'Raw'
//        };
//
//        if (this.req.isDataEventPaused)
//            this.req.resumeDataEvent();
//
//        this.req.on('data', function (data) {
//            parser.pushData(data);
//        });
//        this.req.once('end', function () {
//            that.req.isBodyParsed = true;
//            callback.call(null, null, that.req.params.body);
//
//            delete parser;
//        });
//        this.req.once('close', function () {
//            parser.onPartEnd();
//            callback.call(null, new Error('Connection closed before the end of the request.'), null);
//
//            delete parser;
//        });
//
//        this.req.response.once('end', function () {
//            that.req.removeUploadedFiles();
//        });
//
//        parser.onPartBegin = function () {
//            Log.d('vojo-MultipartFormDataParser#onPartBegin', 'Clearing "param".');
//            param.name  = null;
//            param.type  = null;
//            param.value = null;
//        };
//        parser.onPartHeader = function (key, value) {
//            Log.d('vojo-MultipartFormDataParser#onPartHeader', 'key=%s, value=%s', key, value);
//
//            if (key.match(/^ *content-disposition *$/i))
//            {
//                var matches;
//
//                if ((matches = value.match(/^ *form-data; *name="(.+)"; *filename="(.*)" *$/)) !== null)
//                {
//                    if (that.uploadDir === null)
//                        Log.w('vojo-MultipartFormDataParser#onPartHeader', 'The "uploadDir" property is null. Trying to upload file in the current working directory.');
//                    param.name  = matches[1];
//                    param.type  = ParameterType.File;
//                    param.value = {
//                        name    : matches[2],
//                        tmpname : PATH.join(that.uploadDir, _uniqueId())
//                    };
//                    try {
//                        param.value._writeStream = new FS.createWriteStream(param.value.tmpname, {
//                            flags: 'w',
//                            mode : 0644
//                        });
//                    } catch (e) {
//                        Log.e('vojo-MultipartFormDataParser#onPartHeader', 'Error while creating the destination file: ', e.message);
//                        param.value.error = e;
//                        param.value._writeStream = null;
//                    }
//                }
//                else if ((matches = value.match(/^ *form-data; *name="(.+)" *$/)) != null)
//                {
//                    param.name = matches[1];
//                    param.value = '';
//                    param.type = ParameterType.Raw;
//                }
//                else
//                {
//                    Log.w('vojo-MultipartFormDataParser#onPartHeader', 'Unsupported Content-Disposition "%s".', value);
//                }
//            }
//            else if (key.match(/^ *content-type *$/i))
//            {
//                if (param.type === ParameterType.File)
//                    param.value.type = value;
//            }
//            else
//            {
//                Log.w('vojo-MultipartFormDataParser#onPartHeader', 'Unhandled header "%s".', value);
//            }
//        };
//        parser.onPartData = function (data) {
//            Log.d('vojo-MultipartFormDataParser#onPartData', 'param.name=%s, param.type=%s, data.length=%d', param.name, param.type, data.length);
//
//            switch (param.type)
//            {
//                case ParameterType.File:
//                    if (param.value._writeStream !== null)
//                    {
//                        if (param.value._writeStream.write(data) === false)
//                        {
//                            param.value._writeStream.once('drain', function () {
//                                that.req.resumeDataEvent();
//                            });
//                            that.req.pauseDataEvent();
//                        }
//                    }
//                    break;
//
//                case ParameterType.Raw:
//                    param.value += data.toString('ASCII');
//                    break;
//            };
//        };
//        parser.onPartEnd = function () {
//            Log.d('vojo-MultipartFormDataParser#onPartEnd', 'param.name=%s, param.type=%s', param.name, param.type);
//
//            switch (param.type)
//            {
//                case ParameterType.File:
//                    if (param.value._writeStream !== null)
//                    {
//                        param.value._writeStream.end();
//                        param.value._writeStream = null;
//                    }
//                    break;
//            }
//            that.req.params.body[param.name] = param.value;
//        };
    }
}

BodyParser.prototype = {

    parse: function (request, callback) {
        var content_type   = request.getHeader('Content-Type');
        var content_length = request.getHeader('Content-Length');

        if (this.maxContentLength !== undefined && this.maxContentLength < content_length) {
            Log.e('vane', '[%s] Request entity too large (content_type=%s, content_length=%d).', request.peerName, content_type, content_length);
            if (request.getResponse())
                request.getResponse.requestEntityTooLarge();
        } else {
            for (var pattern in BodyParser.Parsers) {
                var matches;

                if ((matches = content_type.match(new RegExp(pattern))) !== null) {
                    BodyParser.Parsers[pattern].call(this, matches, request, callback);
                    return this;
                }
            }
            Log.e('vane', '[%s] Unsupported Content-Type "%s". (content_length=%d).', request.peerName, content_type, content_length);
            if (request.getResponse())
                request.getResponse().internalServerError();
        }
        return this;
    }

};

module.exports = BodyParser;
