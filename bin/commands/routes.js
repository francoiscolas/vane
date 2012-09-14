var PATH = require('path');

var spaces = function (n) {
    var string = '';

    for (var i = 0; i < n; i++)
        string += ' ';
    return string;
};

module.exports = function () {
    var app   = new (require(PATH.join(process.cwd(), 'config', 'application.js')))();
    var lines = [];
    var sizes = [0, 0, 0];

    app.router.routes.forEach(function (route) {
        var line = [];

        line[0] = route.via.join(',').toUpperCase();
        line[1] = route.path;
        line[2] = route.to || '-> ' + route.redirectTo;
        lines.push(line);
    });

    lines.forEach(function (line) {
        (line[0].length > sizes[0]) && (sizes[0] = line[0].length);
        (line[1].length > sizes[1]) && (sizes[1] = line[1].length);
        (line[2].length > sizes[2]) && (sizes[2] = line[2].length);
    });
    lines.forEach(function (line) {
        console.log(line[0] + spaces(sizes[0] - line[0].length) + ' '
            + line[1] + spaces(sizes[1] - line[1].length) + ' '
            + line[2] + spaces(sizes[2] - line[2].length));
    });
};
