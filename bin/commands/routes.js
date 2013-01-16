var PATH = require('path');
var VANE = require('../../../vane');

var spaces = function (n) {
    var string = '';

    for (var i = 0; i < n; i++)
        string += ' ';
    return string;
};

module.exports = function () {
    var app   = new vane.Application(process.cwd());
    var lines = [];
    var sizes = [0, 0, 0];

    app.router.routes.forEach(function (route) {
        var columns = [];

        columns[0] = route.via.join(',').toUpperCase();
        columns[1] = route.path;
        columns[2] = route.to || '-> ' + route.redirectTo;
        lines.push(columns);
    });
    lines.forEach(function (columns) {
        (columns[0].length > sizes[0]) && (sizes[0] = columns[0].length);
        (columns[1].length > sizes[1]) && (sizes[1] = columns[1].length);
        (columns[2].length > sizes[2]) && (sizes[2] = columns[2].length);
    });
    lines.forEach(function (columns) {
        console.log(columns[0] + spaces(sizes[0] - columns[0].length)
            + ' ' + columns[1] + spaces(sizes[1] - columns[1].length)
            + ' ' + columns[2] + spaces(sizes[2] - columns[2].length));
    });
};
