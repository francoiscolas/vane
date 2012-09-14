var _       = require('underscore');
var MONGODB = require('mongodb');
var PATH    = require('path');
var Log     = require('./log');

var Database = module.exports = function (application, options) {
    this.application = application;
    this.host     = Database.DEFAULT_HOST;
    this.port     = Database.DEFAULT_PORT;
    this.poolSize = Database.DEFAULT_POOL_SIZE;
    this.database = null;
    this._server  = null;
    this._db      = null;
    this._configure(options);
};

Database.DEFAULT_HOST      = '127.0.0.1';
Database.DEFAULT_PORT      = 27017;
Database.DEFAULT_POOL_SIZE = 100;

Database.prototype = {

    start: function (callback) {
        this._server = new MONGODB.Server(this.host, this.port, {
            auto_reconnect: true,
            poolSize      : this.poolSize
        });
        this._db = new MONGODB.Db(this.database, this._server);
        this._db.open(function (error) {
            if (error !== null)
                Log.e('vane.Database#start', 'Error: %s', error.stack);
            callback && callback(error);
        });
    },

    stop: function (callback) {
        this._db.close(callback);
        this._db = null;
        this._server = null;
    },

    getCollection: function (collectionName, callback) {
        this._db.collection(collectionName, function (error, collection) {
            if (error !== null)
                callback(error, null);
            else
                callback(null, collection);
        });
    },

    _configure: function (options) {
        try {
            var fileOptions = require(PATH.join(this.application.configDir, 'database.json'));
            _.extend(this, fileOptions[this.application.environnement], options);
        } catch (error) {
            Log.e('vane.Database#_configure', 'Error: %s', error.stack);
        }
    }

};
