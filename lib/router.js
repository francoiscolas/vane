var _    = require('underscore');
var FS   = require('fs');
var PATH = require('path');

var BodyParser = require('./body_parser');
var Log        = require('./log');
var Route      = require('./route');

var Router = module.exports = function (application, options) {
    this.application      = application;

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

    handleRequest: function (request, response) {
        var matched = false;
        var handled = false;

        for (var i = 0; !handled && i < this.routes.length; i++) {
            var route = this.routes[i];

            if ((request.params.path = route.match(request.path)) !== null) {
                if (route.via.indexOf(request.method.toLowerCase()) >= 0) {
                    Log.d('vane', '[%s] Match succeed between path %s and route %s.', request.peerName, request.path, route.path);

                    if (request.hasBody && (route.autoParseBody || (route.autoParseBody === undefined && this.autoParseBody))) {
                        this._parseBody(request, response, route, function () {
                            this._exec(request, response, route);
                        });
                    } else {
                        this._exec(request, response, route);
                    }
                    handled = true;
                }
                matched = true;
            }
        }

        if (matched && !handled)
            response.methodNotAllowed();

        return matched;
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
        response.setHeaders({
            'Server'      : 'vane/' + require('./vane').version,
            'Content-Type': 'text/html; charset=utf-8',
            'Date'        : new Date()
        });
        if (route.to !== null) {
            var controller;

            if ((controller = this.application.controllers.create(route.controller)) !== null)
                controller.action(route.action, request, response);
            else
                response.internalServerError();
        } else if (route.redirectTo !== null) {
            response.movedPermanently(route.redirectTo);
        } else {
            response.internalServerError();
        }
    },

    _parseBody: function (request, response, route, callback) {
        var max_content_length = (route.maxContentLength !== undefined) ? route.maxContentLength : this.maxContentLength;
        var self               = this;

        if (max_content_length >= request.getHeader('Content-Length')) {
            request.parseBody({
                maxContentLength: max_content_length,
                uploadDir       : this.uploadDir
            }, function (error, bodyParams) {
                if (error !== null)
                    response.internalServerError();
                else
                    self._exec(request, response, route);
            });
        } else {
            response.requestEntityTooLarge();
        }
    }

};
