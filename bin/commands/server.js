var VANE = require('../../../vane');

module.exports = function (argv) {
    var options = {};

    if (argv.e) options.environment = argv.e;
    if (argv.p) options.port = argv.p;
    return VANE.start(process.cwd(), options);
};
