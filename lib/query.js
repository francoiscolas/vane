var _           = require('underscore');
var Application = require('./application');
var Log         = require('./log');

var Query = module.exports = function (model) {
    this.model          = model;
    this._conditions    = null;
    this._fields        = null;
    this._sortBy        = null;
    this._sortDirection = null;
    this._skip          = null;
    this._limit         = null;
};

Query.prototype = {

    // conditions, [fields], [skip], [limit]
    find: function (conditions, fields, skip, limit) {
        if (_.isString(conditions))
            conditions = {_id: conditions};
        this._conditions = conditions;
        if (!_.isUndefined(fields)) this._fields = fields;
        if (!_.isUndefined(skip)) this._skip = skip;
        if (!_.isUndefined(limit)) this._limit = limit;
        return this;
    },

    // conditions, [fields]
    findOne: function (conditions, fields) {
        return this.find(conditions, fields).limit(1);
    },

    sort: function (fields, direction) {
        this._sortBy = fields;
        this._sortDirection = direction;
        return this;
    },

    limit: function (n) {
        this._limit = n;
        return this;
    },

    skip: function (n) {
        this._skip = n;
        return this;
    },

    count: function (callback) {
        this._cursor(function (error, cursor) {
            if (error !== null) {
                Log.e('vane.Query#count', 'Error: %s', error.stack);
                callback && callback(0);
            } else {
                cursor.count(function (error, count) {
                    if (error !== null) {
                        Log.e('vane.Query#count', 'Error: %s', error.stack);
                        callback && callback(0);
                    } else {
                        callback && callback(count);
                    }
                    //cursor._vane.connection.close();
                });
            }
        });
    },

    each: function (callback) {
        var self = this;

        self._cursor(function (error, cursor) {
            if (error !== null) {
                Log.e('vane.Query#each', 'Error: %s', error);
                callback && callback(null);
            } else {
                var stream = cursor.stream();

                stream.on('error', function (error) {
                    Log.e('vane.Query#each', 'Error: %s', error);
                    callback && callback(null);
                });
                stream.on('data', function (doc) {
                    callback && callback(new self.model(doc));
                });
                stream.on('close', function () {
                    //cursor._vane.connection.close();
                });
            }
        });
    },

    toArray: function (callback) {
        var self = this;

        self._cursor(function (error, cursor) {
            if (error !== null) {
                Log.e('vane.Query#toArray', 'Error: %s', error);
                callback && callback([]);
            } else {
                cursor.toArray(function (error, docs) {
                    if (error !== null) {
                        Log.e('vane.Query#toArray', 'Error: %s', error);
                        callback && callback([]);
                    } else {
                        var models = [];

                        for (var i = 0; i < docs.length; i++)
                            models.push(new self.model(docs[i]));
                        callback && callback(models);
                    }
                    //cursor._vane.connection.close();
                });
            }
        });
    },

    get: function (callback) {
        var self = this;

        self.toArray(function (docs) {
            callback && callback((docs && docs[0]) || null);
        });
    },

    update: function () {
        // TODO
    },

    destroy: function (callback) {
        var self = this;

        Application.instance.database.getCollection(self.model.collectionName, function (error, collection) {
            if (error !== null) {
                callback && callback(error, 0);
            } else {
                collection.remove(self._conditions || {}, {safe: true}, function (error, count) {
                    if (error !== null) {
                        callback && callback(error, 0);
                    } else {
                        callback && callback(null, count);
                    }
                });
            }
            // collection.db.close(); ???
        });
    },

    _cursor: function (callback) {
        var self = this;

        Application.instance.database.getCollection(self.model.collectionName, function (error, collection) {
            if (error !== null) {
                callback(error, null);
            } else {
                var cursor = collection.find(self._conditions || {}, self._fields || {});

                if (self._skip !== null) cursor.skip(self._skip);
                if (self._limit !== null) cursor.limit(self._limit);
                if (self._sortBy !== null) cursor.sort(self._sortBy, self._sortDirection);
                cursor._vane = {collection: collection};
                callback(null, cursor);
            }
        });
    }

};
