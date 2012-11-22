var _ = require('underscore');

var Session = function (id, attributes, options) {
    this.id = id;
    this.attributes = attributes || {};
    _.extend(this, options);
};

Session.prototype = {

    set: function (key, value, options) {
        var attrs;

        if (_.isObject(key) || !key) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }
        options || (options = {});

        for (var key in attrs) {
            if (options.unset)
                delete this.attributes[key];
            else
                this.attributes[key] = attrs[key];
        }
    },

    get: function (key) {
        return this.attributes[key];
    },

    has: function (key) {
        return (this.attributes[key] !== undefined);
    },

    save: function (callback) {
        this._factory.save(this, callback);
    },

    destroy: function (callback) {
        this._factory.destroy(this, callback);
    },

    toJSON: function () {
        return _.clone(this.attributes);
    }

};

module.exports = Session;
