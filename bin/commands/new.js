var FS   = require('fs');
var PATH = require('path');

var appName = null;
var appNameLowerCase = null;

var copy = function (source, dest) {
    var entries = FS.readdirSync(source);

    if (!FS.existsSync(dest))
        FS.mkdirSync(dest, 0755);

    for (var i = 0; i < entries.length; i++) {
        var s = PATH.join(source, entries[i]);
        var d = PATH.join(dest, entries[i]);

        console.log('create %s', d);
        if (FS.statSync(s).isDirectory())
            copy(s, d);
        else
            FS.writeFileSync(d, FS.readFileSync(s, 'UTF-8').replace(/__APP_NAME__/g, appName), 'UTF-8');
    }
};

module.exports = function (argv) {
    var templatePath = PATH.join(__dirname, '..', '..', 'template');
    var appPath      = argv._.pop();

    if (!appPath)
        return -1;

    appName = PATH.basename(appPath);
    appNameLowerCase = appName.toLowerCase();

    if (appName === '.' || appName === '..')
        appName = PATH.basename(process.cwd());

    copy(templatePath, appPath);
};
