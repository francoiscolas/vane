var app = new (require('./config/application.js'))({
    // options
});

// serve static files when launched in development mode
if (app.isDevelopment()) {
    var static = new (require('node-static').Server)(app.publicDir);

    app._handle404 = function (request, response) {
        static.serve(request.nodeRequest, response.nodeResponse);
    };
}

app.start(8080, '127.0.0.1');
