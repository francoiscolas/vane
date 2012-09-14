var app = new (require('./config/application.js'))({
    // options
});

if (app.isDevelopment()) // serve static files when launched in development mode
{
    var static = new (require('node-static').Server)(app.publicDir);

    app.server.addHandler(function (request, response, next) {
        static.serve(request._nreq, response._nresp);
    });
}
app.start();
