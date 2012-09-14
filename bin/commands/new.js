var PATH       = require('path');
var FS         = require('fs');
var camelize   = require('../camelize');
var underscore = require('../underscore');

var APP_NAME            = null;
var APP_NAME_CAMEL_CASE = null;
var APP_NAME_LOWER_CASE = null;

var copy = function (source, dest) {
    if (!FS.existsSync(dest))
        FS.mkdir(dest, 0755);

    var entries = FS.readdirSync(source);

    for (var i = 0; i < entries.length; i++) {
        var s = PATH.join(source, entries[i]);
        var d = PATH.join(dest, entries[i]);

        console.log('create %s', d);
        if (FS.statSync(s).isDirectory()) {
            copy(s, d);
        } else {
            FS.writeFileSync(d, FS.readFileSync(s, 'UTF-8')
                .replace(/__APP_NAME__/g, APP_NAME)
                .replace(/__APP_NAME_CAMEL_CASE__/g, APP_NAME_CAMEL_CASE)
                .replace(/__APP_NAME_LOWER_CASE__/g, APP_NAME_LOWER_CASE) , 'UTF-8');
        }
    }
};

module.exports = function (path) {
    if (!path)
        return -1;

    var name = PATH.basename(path);

    if (name === '.' || name === '..')
        name = PATH.basename(process.cwd());
    APP_NAME            = name;
    APP_NAME_CAMEL_CASE = camelize(name);
    APP_NAME_LOWER_CASE = name.toLowerCase();

    copy(PATH.join(__dirname, '..', '..', 'template'), path);
};
