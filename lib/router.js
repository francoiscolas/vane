var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var BodyParser = require('./body_parser');
var Log        = require('./log');
var Route      = require('./route');

var Router = module.exports = function (application, options) {
    this.application      = application;
    this.application.server.addHandler(_.bind(this._onRequest, this));

    this.headers          = [];
    this.maxContentLength = 2 * 1024 * 1024; // 2MB
    this.autoParseBody    = true;
    this.uploadDir        = BodyParser.DEFAULT_UPLOAD_DIR;
    this.routes           = [];

    this._configure(options);
};

Router.prototype = {

    root: function (options) {
        this.match('/', options);
    },

    get: function (path, options) {
        this.match(path, _.extend(options, {via: ['get']}));
    },

    post: function (path, options) {
        this.match(path, _.extend(options, {via: ['post']}));
    },

    delete: function (path, options) {
        this.match(path, _.extend(options, {via: ['delete']}));
    },

    put: function (path, options) {
        this.match(path, _.extend(options, {via: ['put']}));
    },

    resource: function (path, options) {
        options || (options = {});

        var controller = (options.controller || path).replace(/^\//, '');
        var actions    = {
            'new'    : (options.only && _.include(options.only, 'new')) || (options.except && _.include(options.except, 'new')) || true,
            'create' : (options.only && _.include(options.only, 'create')) || (options.except && _.include(options.except, 'create')) || true,
            'show'   : (options.only && _.include(options.only, 'show')) || (options.except && _.include(options.except, 'show')) || true,
            'edit'   : (options.only && _.include(options.only, 'edit')) || (options.except && _.include(options.except, 'edit')) || true,
            'update' : (options.only && _.include(options.only, 'update')) || (options.except && _.include(options.except, 'update')) || true,
            'destroy': (options.only && _.include(options.only, 'destroy')) || (options.except && _.include(options.except, 'destroy')) || true
        };

        actions.new     && this.match(path + '/new' , {to: controller + '#new'    , via: ['get']});
        actions.create  && this.match(path          , {to: controller + '#create' , via: ['post']});
        actions.show    && this.match(path          , {to: controller + '#show'   , via: ['get']});
        actions.edit    && this.match(path + '/edit', {to: controller + '#edit'   , via: ['get']});
        actions.update  && this.match(path          , {to: controller + '#update' , via: ['put']});
        actions.destroy && this.match(path          , {to: controller + '#destroy', via: ['delete']});
    },

    resources: function (path, options) {
        options || (options = {});

        var controller = (options.controller || path).replace(/^\//, '');
        var actions    = {
            'index'  : (options.only && _.include(options.only, 'index')) || (options.except && _.include(options.except, 'index')) || true,
            'new'    : (options.only && _.include(options.only, 'new')) || (options.except && _.include(options.except, 'new')) || true,
            'create' : (options.only && _.include(options.only, 'create')) || (options.except && _.include(options.except, 'create')) || true,
            'show'   : (options.only && _.include(options.only, 'show')) || (options.except && _.include(options.except, 'show')) || true,
            'edit'   : (options.only && _.include(options.only, 'edit')) || (options.except && _.include(options.except, 'edit')) || true,
            'update' : (options.only && _.include(options.only, 'update')) || (options.except && _.include(options.except, 'update')) || true,
            'destroy': (options.only && _.include(options.only, 'destroy')) || (options.except && _.include(options.except, 'destroy')) || true
        };

        actions.index   && this.match(path              , {to: controller + '#index'  , via: ['get']});
        actions.new     && this.match(path + '/new'     , {to: controller + '#new'    , via: ['get']});
        actions.create  && this.match(path              , {to: controller + '#create' , via: ['post']});
        actions.show    && this.match(path + '/:id'     , {to: controller + '#show'   , via: ['get']});
        actions.edit    && this.match(path + '/:id/edit', {to: controller + '#edit'   , via: ['get']});
        actions.update  && this.match(path + '/:id'     , {to: controller + '#update' , via: ['put']});
        actions.destroy && this.match(path + '/:id'     , {to: controller + '#destroy', via: ['delete']});
    },

    match: function (path, options) {
        this.routes.push(new Route(path.replace(/^([^/])/, '/$1'), options));
    },

    _configure: function (options) {
        try
        {
            var filePath = PATH.join(this.application.configDir, 'routes.js');
            var code     = FS.readFileSync(filePath, 'UTF-8');

            with (this) {
                eval(code);
            }
        }
        catch (error)
        {
            Log.e('vane.Router#_configure', 'Error while reading "routes.js".');
            Log.e('vane.Router#_configure', 'Error: %s', error.stack);
        }
        _.extend(this, options);
    },

    _exec: function (request, response, route) {
        if (route.to !== null)
        {
            var controller;

            Log.d('vane.Router#_exec', '[%s] Calling %s.', request.peerName, route.to);
            if ((controller = this.application.controllers.get(route.controller)) !== null
                    && typeof controller[route.action] === 'function')
            {
                _.each(this.headers, function (value, name) {
                    response.setHeader(name, value);
                });
                controller.action(route.action, request, response);
            }
            else
            {
                Log.e('vane.Router#_exec', '[%s] Error: Action "%s" not found.', request.peerName, route.to);
                response.internalServerError();
            }
        }
        else if (route.redirectTo !== null)
        {
            Log.d('vane.Router#_exec', '[%s] Redirecting request to "%s".', request.peerName, route.redirectTo);
            response.movedPermanently(route.redirectTo);
        }
        else 
        {
            Log.e('vane.Router#_exec', '[%s] Error: Neither Route#to nor Route#redirectTo defined for route "%s".', request.peerName, route.path);
            response.internalServerError();
        }
    },

    _parseBody: function (request, response, route, callback) {
        /*
        var max_content_length = (route.maxContentLength !== null) ? route.maxContentLength : this.maxContentLength;
        var auto_parse_body = (route.autoParseBody !== null) ? route.autoParseBody : this.autoParseBody;

        if (max_content_length >= req.headers['content-length'])
        {
            if (auto_parse_body)
            {
                var that = this;

                req.parseBody(function (error, bodyParams) {
                    if (error !== null)
                    {
                        Log.e('vojo.Router.processRequest', 'Error while parsing the request body: %s.', error.message);
                        resp.internalServerError();
                    }
                    else
                    {
                        _exec.call(that, req, resp, route);
                    }
                }, {
                    maxContentLength: max_content_length,
                    uploadDir     : this.uploadDir
                });
            }
            else
            {
                _exec.call(this, req, resp, route);
            }
        }
        else
        {
            resp.requestEntityTooLarge();
        }
        */
    },

    _onRequest: function (request, response, next) {
        var matched = false;

        for (var i = 0; i < this.routes.length; i++)
        {
            var route = this.routes[i];

            if ((request.params.path = route.match(request.path)) === null)
                Log.d('vane.Router#_onRequest', '[%s] Match failed between path %s and route %s.', request.peerName, request.path, route.path);
            else
            {
                if (route.via.indexOf(request.method.toLowerCase()) >= 0)
                {
                    Log.d('vane.Router#_onRequest', '[%s] Match succeed between path %s and route %s.', request.peerName, request.path, route.path);

                    if (request.hasBody && (route.autoParseBody || (route.autoParseBody === null && this.autoParseBody)))
                    {
                        this._parseBody(request, response, route, function () {
                            this._exec(request, response, route);
                        });
                    }
                    else
                    {
                        this._exec(request, response, route);
                    }
                    return ;
                }
                matched = true;
            }
        }

        if (matched)
            response.methodNotAllowed();
        else
        {
            Log.d('vane.Router#_onRequest', '[%s] No route found for path "%s".', request.peerName, request.path);
            next();
        }
    }

};
