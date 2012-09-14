var _ = require('underscore');

var Log = require('./log');

var Controller = module.exports = function (name, application) {
    this.name        = name;
    this.application = application;

    this.params   = null;
    this.request  = null;
    this.response = null;
    this.layout   = 'application';
    this.done     = false;

    this.initialize(name, application);
    return this;
};

Controller.extend = require('./inherits');

Controller.prototype = {

    initialize: function () {
    },

    action: function (action, request, response) {
        var self = this;

        if (typeof self[action] === 'function')
        {
            request.sessionStart(function (session) {
                self.action   = action;
                self.params   = request.params;
                self.request  = request;
                self.response = response;
                self.session  = session;
                self[action](self.params);
            });
        }
        else
        {
            Log.e('vane.Controller#action', '[%s] Error: Action "%s#%s" not found.', self.request.peerName, self.name, self.action);
            self.response.internalServerError();
        }
    },

    render: function (action, options) {
        var view;

        if (this.done)
            return ;
        this.done = true;

        var options    = (_.isObject(_.last(arguments))) ? _.last(arguments) : {};
        var layout     = options.layout || this.layout;
        var controller = options.controller || this.name;
        var action     = (_.isString(action)) ? action : this.action;
        var viewPath   = controller + '/' + action;

        if ((view = this.application.views.get(this, layout, viewPath)) !== null)
        {
            this.response.end(view.render());
        }
        else
        {
            Log.e('vane.Controller#render', '[%s] Error: Can\'t create the view "%s" with layout "%s".', this.request.peerName, viewPath, layout);
            this.response.internalServerError();
        }
    },

    redirectTo: function (location, options) {
        if (this.done)
            return ;
        this.done = true;

        if (options && options.statusCode)
            this.endHead(statusCode, {'Location': location});
        else
            this.response.movedTemporarily(location);
    }

};
