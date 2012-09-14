var Model = module.exports = function (attributes) {
    this.id = null;
    this.errors = null;

    this._attributes = {};
    this._changedAttributes = {};
    this._escapedAttributes = {};
    this._previousAttributes = {};

    this.set(_.extend({}, this.defaults, attributes));
    this._changedAttributes = {};
    this._previousAttributes = _.clone(this._attributes);

    this.initialize.apply(this, arguments);
};

var _           = require('underscore');
var Application = require('./application');
var Query       = require('./query');
var serie       = require('./serie');

Model.extend = function (collectionName, prototype) {
    return _.extend(require('./inherits').call(this, prototype), {collectionName: collectionName});
};

Model.find = function () {
    var query = new Query(this);
    return query.find.apply(query, arguments);
};

Model.findOne = function () {
    var query = new Query(this);
    return query.findOne.apply(query, arguments);
};

Model.sort = function () {
    var query = new Query(this);
    return query.sort.apply(query, arguments);
};

Model.limit = function () {
    var query = new Query(this);
    return query.limit.apply(query, arguments);
};

Model.skip = function () {
    var query = new Query(this);
    return query.skip.apply(query, arguments);
};

Model.collectionName = null;

Model.prototype = {

    defaults: null,

    initialize: function () {
    },

    isNew: function () {
        return (this.id === null);
    },

    isValid: function (callback) {
        callback(true);
    },

    get: function (attribute) {
        return this._attributes[attribute];
    },

    escape: function (attribute) {
        var value = this._escapedAttributes[attribute];
        if (value)
            return value;
        value = this.get(attribute);
        return this._escapedAttributes[attribute] = _.escape((value) ? '' + value : '');
    },

    has: function (attribute) {
        return (this.get(attribute) !== undefined)
    },

    hasChanged: function (attribute) {
        if (attribute) return _.has(this._changedAttributes, attribute);
        return !_.isEmpty(this._changedAttributes);
    },

    set: function (attribute, value, options) {
        var attributes;
    
        if (!attribute) {
            return this;
        } else if (_.isObject(attribute)) {
            attributes = attribute;
            options    = value;
        } else {
            attributes = {};
            attributes[attribute] = value;
        }
        options || (options = {});

        if (_.has(attributes, '_id'))
            this.id = attributes._id;

        var now = this._attributes;
        var prev = this._previousAttributes;

        for (var attribute in attributes) {
            var value = attributes[attribute];

            (options.unset) ? delete now[attribute] : now[attribute] = value;

            if (!_.isEqual(prev[attribute], value)
                    || _.has(prev, attribute) !== _.has(now, attribute)) {
                this._changedAttributes[attribute] = value;
                delete this._escapedAttributes[attribute];
            } else {
                delete this._changedAttributes[attribute];
            }
        }
        return this;
    },

    unset: function (attributes) {
        if (_.isArray(attributes)) {
            var attributes = {};
            for (var i = 0; i < arguments[0].length; i++)
                attributes[arguments[0][i]] = null;
            this.set(attributes, {unset: true});
        } else if (_.isObject(attributes)) {
            this.set(attributes, {unset: true});
        } else {
            this.set(attributes, null, {unset: true});
        }
        return this;
    },

    clear: function () {
        return this.unset(_.keys(this._attributes));
    },

    save: function (options) {
        var self = this;

        options || (options = {});
        if (_.isFunction(options))
            options = {callback: options};

        serie(function (next) {
            if (options.validate === false) {
                next();
            } else {
                self.isValid(function (isValid) {
                    if (isValid) {
                        next();
                    } else {
                        var error = new Error('Attributes validation failed.');
                        options.error && options.error.call(self, error, self);
                        options.callback && options.callback.call(self, error, self);
                    }
                });
            }
        }, function (next) {
            Application.instance.database.getCollection(self._class.collectionName, function (error, collection) {
                if (error !== null) {
                    Log.e('vane.Model#save', 'Error: %s', error);
                    options.error && options.error.call(self, error, self);
                    options.callback && options.callback.call(self, error, self);
                } else {
                    if (self.isNew()) {
                        collection.insert(self._attributes, {safe: true}, next);
                    } else {
                        collection.update({_id: self.id}, {$set: self._changedAttributes}, {safe: true}, next);
                    }
                }
            });
        }, function (error) {
            if (error !== null) {
                Log.e('vane.Model#save', 'Error: %s', error);
                options.error && options.error.call(self, error, self);
                options.callback && options.callback.call(self, error, self);
            } else {
                self._changedAttributes = {};
                self._previousAttributes = _.clone(self._attributes);
                options.success && options.success.call(self, null, self);
                options.callback && options.callback.call(self, null, self);
            }
        });
    },

    saveAttributes: function (key, value, options) {
        var attributes;
        
        if (_.isObject(key) || !key) {
            attributes = key;
            options    = value;
        } else {
            attributes = {};
            attributes[key] = value;
        }

        this.set(attributes, options);
        this.save(options);
    },

    destroy: function (options) {
        var self = this;

        options || (options = {});
        if (_.isFunction(options))
            options = {callback: options};

        Application.instance.database.getCollection(self._class.collectionName, function (error, collection) {
            if (error !== null) {
                options.error && options.error(error, 0);
                options.callback && options.callback(error, 0);
            } else {
                collection.remove({_id: self.id}, options, function (error, count) {
                    if (error !== null) {
                        options.error && options.error(error, 0);
                        options.callback && options.callback(error, 0);
                    } else {
                        options.success && options.success(null, count);
                        options.callback && options.callback(null, count);
                    }
                });
            }
        });
    },

    toJSON: function () {
        return _.clone(this._attributes);
    },

    _validate: function (attributes, callback) {
        callback(null);
        // TODO
    }

};
