var PATH = require('path');
var vane = require('vane');

var __APP_NAME_CAMEL_CASE__ = module.exports = vane.Application.extend({

    rootDir  : PATH.join(__dirname, '..'),

    configDir: PATH.join(__dirname),

    publicDir: PATH.join(__dirname, '..', 'public')

});
