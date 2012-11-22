var PATH = require('path');
var VANE = require('vane');

var Application = VANE.Application.extend({

    rootDir  : PATH.join(__dirname, '..'),

    configDir: PATH.join(__dirname),

    publicDir: PATH.join(__dirname, '..', 'public'),

    tmpDir   : PATH.join(__dirname, '..', 'tmp')

});

module.exports = Application;
