var _   = require('underscore');
var Log = require('./log');

var Controller = function (name, options) {
    this.name        = name;
    this.application = (options && options.application) || null;

    this.layout      = 'application';
    this.params      = {};
    this.request     = null;
    this.response    = null;
    this.session     = null;
    this.flash       = {};
    this.view        = {};

    this._filters    = {};

    this.initialize.apply(this, arguments);
};

Controller.extend = require('./inherits');

Controller.prototype = {

    initialize: function () {
    },

    action: function (action, request, response) {
        var self = this;

        if (typeof self[action] === 'function') {
            request.sessionStart(function (session) {
                self.action   = action;
                self.params   = _.extend({}, request.params.path, request.params.query, request.params.body);
                self.request  = request;
                self.response = response;
                self.session  = session;

                var filters = _.filter(_.keys(self._filters), function (filter) {
                    return ((self._filters[filter].only.length === 0 || self._filters[filter].only.indexOf(action) >= 0)
                            && (self._filters[filter].except.length === 0 || self._filters[filter].except.indexOf(action) === -1));
                });

                if (filters.length === 0) {
                    self[self.action](self.params);
                } else {
                    (function _next(i) {
                        var filter = self[filters[i]];

                        if (typeof filter === 'function') {
                            var callback = function (result) {
                                if (result === true)
                                    (i < (filters.length - 1)) ? _next(i + 1) : self[self.action](self.params);
                            };
                            callback(filter.call(self, callback));
                        } else {
                            Log.e('vane', "Error: can't find filter '%s'.", filters[i]);
                            self.response.internalServerError();
                        }
                    })(0);
                }
            });
        } else {
            Log.e('vane', '[%s] Error: Action "%s#%s" not found.', self.request.peerName, self.name, self.action);
            self.response.internalServerError();
        }
    },

    render: function (action, options) {
        if (this.response.ended)
            return ;

        if (_.isObject(action)) {
            options = action;
            action  = this.action;
        } else {
            options = options || {};
            action  = action || this.action;
        }

        if (!options.flash) {
            if (this.session.has('flash'))
                options.flash = this.session.get('flash');
            else
                options.flash = this.flash;
        }

        var controller = (_.has(options, 'controller')) ? options.controller : this.name;
        var layout     = (_.has(options, 'layout')) ? options.layout : this.layout;
        var view_path  = controller + '/' + action;

        try {
            if ((view = this.application.views.create(layout, view_path, {controller: this})) !== null) {
                this.response.end(view.render(options));
            } else {
                Log.e('vane', '[%s] Error: View %s or layout %s not found.', this.request.peerName, view_path, layout);
                this.response.internalServerError();
            }
        } catch (error) {
            this.request.trigger('error', error);
        }

        this.session.unset('flash');
    },

    redirectTo: function (location, options) {
        if (this.response.ended)
            return ;

        var options = options || {};

        if (options.flash)
            this.session.set('flash', options.flash);

        if (options.statusCode)
            this.endHead(options.statusCode, {'Location': location});
        else
            this.response.movedTemporarily(location);
    },

    filter: function (filter, options) {
        options = _.defaults(options || {}, {only: [], except: []});
        options.only = [].concat(options.only);
        options.except = [].concat(options.except);

        this._filters[filter] = options;
    },

    skipFilter: function (filter, options) {
        options = _.defaults(options || {}, {only: [], except: []});
        options.only = [].concat(options.only);
        options.except = [].concat(options.except);

        if (this._filters[filter]) {
            this._filters[filter].only = this._filters[filter].only.concat(options.except);
            this._filters[filter].except = this._filters[filter].except.concat(options.only);
        }
    }

};

module.exports = Controller;
