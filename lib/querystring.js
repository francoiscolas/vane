var QUERYSTRING = require('querystring');

var _isObject = function (object) {
    return (object === Object(object));
};


var _stringifyPrimitive = function (v) {
    switch (typeof v) {
        case 'string':
            return v;
        case 'boolean':
            return v ? 'true' : 'false';
        case 'number':
            return isFinite(v) ? v : '';
        default:
            return '';
    }
};

var QueryString = {

    stringify: function (object, options) {
        options || (options = {});

        var sep  = options.sep || '&';
        var eq   = options.eq || '=';
        var name = options.name;

        if (options.brackets === false) {
            return QUERYSTRING.stringify(object, sep, eq, name);
        } else {
            return (function _encode(object, name) {
                if (object === null) {
                    return (name && (name + eq)) + 'null';
                } else if (object === undefined) {
                    return (name && (name + eq)) + 'undefined';
                } else if (Array.isArray(object)) {
                    return object.map(function (value) {
                        return _encode(value, name + '%5B%5D');
                    }).join(sep);
                } else if (_isObject(object)) {
                    return Object.keys(object).map(function (key) {
                        var escKey = QUERYSTRING.escape(key);
                        return _encode(object[key], (name) ? name + '%5B' + escKey + '%5D' : escKey);
                    }).join(sep);
                } else {
                    return (name && (name + eq))
                        + QUERYSTRING.escape(_stringifyPrimitive(object));
                }
            })(object, QUERYSTRING.escape(name || ''));
        }
    },

    parse: function (string, options) {
        var result  = {};

        if (typeof string !== 'string' || string.length === 0)
            return result;

        options || (options = {});

        var regexp = /\+/g;
        var sep    = options.sep || '&';
        var eq     = options.eq || '=';
        var pairs  = string.split(sep);

        pairs.forEach(function (pair) {
            var pair  = pair.replace(regexp, '%20');
            var index = pair.indexOf(eq);
            var key   = decodeURIComponent((index >= 0) ? pair.substr(0, index) : pair);
            var value = decodeURIComponent((index >= 0) ? pair.substr(index + 1) : '');

            if (options.brackets === false) {
                if (result[key] === undefined)
                    result[key] = value;
                else if (Array.isArray(result[key]))
                    result[key].push(value);
                else
                    result[key] = [result[key], value];
            } else {
                if (!~key.indexOf('[')) {
                    result[key] = value;
                } else {
                    var tokens = key.split('[');
                    var cursor = result;

                    for (var j = 0; j < tokens.length; ++j) {
                        var token     = tokens[j];
                        var nextToken = tokens[j + 1];
                        var key       = token.replace(/\]$/, '');

                        if (nextToken !== undefined) {
                            if (token === ']') {
                                if (nextToken === ']')
                                    cursor.push(cursor = []);
                                else
                                    cursor = cursor[key] || (cursor[key] = {});
                            } else {
                                cursor = cursor[key]
                                    || (cursor[key] = (nextToken === ']') ? [] : {});
                            }
                        } else {
                            if (Array.isArray(cursor))
                                cursor.push(value);
                            else
                                cursor[key] = value;
                        }
                    }
                }
            }
        });
        return result;
    }

};

module.exports = QueryString;
