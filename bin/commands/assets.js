var CLEANCSS = require('clean-css');
var FS       = require('fs');
var PATH     = require('path');
var UGLIFYJS = require('uglify-js');
var ZLIB     = require('zlib');
var vane     = require('../../../vane');

var noop = function () {
};

var map = function (list, iterator) {
    var o = {};

    for (var key in list)
        o[key] = iterator(list[key]);
    return o;
};

var rm = function (path) {
    if (FS.existsSync(path)) {
        if (FS.statSync(path).isDirectory()) {
            FS.readdirSync(path).forEach(function (entry) {
                rm(PATH.join(path, entry));
            });
            FS.rmdirSync(path);
        } else {
            FS.unlinkSync(path);
        }
    }
    return path;
};

var gzip = function (inputFile, outputFile, callback) {
    FS.createReadStream(inputFile).pipe(ZLIB.createGzip()).pipe(FS.createWriteStream(outputFile)).on('close', callback || noop);
};

var minifyJavascripts = function (javascripts, destDir, callback) {
    var groups = Object.keys(javascripts);
    var i      = 0;

    (function next() {
        var group   = groups[i++];
        var sources = javascripts[group];
        var dest    = PATH.join(destDir, group) + '.js';

        rm(dest); rm(dest + '.gz');

        if (sources.length === 0) {
            (i < groups.length) ? next() : callback && callback();
        } else {
            console.log('creating %s.js', group);
            for (var j = 0; j < sources.length; j++) {
                var ast = UGLIFYJS.parser.parse(FS.readFileSync(sources[j], 'UTF-8'));

                ast = UGLIFYJS.uglify.ast_mangle(ast);
                ast = UGLIFYJS.uglify.ast_squeeze(ast);
                FS.appendFileSync(dest, UGLIFYJS.uglify.gen_code(ast));
            }

            console.log('creating %s.js.gz', group);
            gzip(dest, dest + '.gz', (i < groups.length) ? next : callback);
        }
    })();
};

var minifyStylesheets = function (stylesheets, destDir, callback) {
    var groups = Object.keys(stylesheets);
    var i      = 0;

    (function next() {
        var group   = groups[i++];
        var sources = stylesheets[group] || [];
        var dest    = PATH.join(destDir, group) + '.css';

        rm(dest); rm(dest + '.gz');

        if (sources.length === 0) {
            (i < groups.length) ? next() : callback && callback();
        } else {
            console.log('creating %s.css', group);
            for (var j = 0; j < sources.length; j++)
                FS.appendFileSync(dest, CLEANCSS.process(FS.readFileSync(sources[j], 'UTF-8')));

            console.log('creating %s.css.gz', group);
            gzip(dest, dest + '.gz', (i < groups.length) ? next : callback);
        }
    })();
};

module.exports = function () {
    var app        = new vane.Application(process.cwd());
    var assetsPath = PATH.join(app.publicDir, 'assets');

    var javascripts = map(app.assets.javascripts, function (sources) {
        return sources.map(function (source) {
            return PATH.join(app.publicDir, source);
        });
    });

    var stylesheets = map(app.assets.stylesheets, function (sources) {
        return sources.map(function (source) {
            return PATH.join(app.publicDir, source);
        });
    });

    FS.mkdirSync(rm(assetsPath), 0755);

    minifyJavascripts(javascripts, assetsPath, function () {
        minifyStylesheets(stylesheets, assetsPath);
    });
};
