var serie = function (/*functions...*/) {
    var functions = Array.prototype.slice.call(arguments);
    var last      = functions.pop();
    var i         = 0;

    (function _next(error) {
        if (error || i === functions.length) {
            last.apply(null, arguments);
        } else {
            var args = Array.prototype.slice.call(arguments, 1).concat(_next);
            functions[i++].apply(null, args);
        }
    })();
};

module.exports = serie;
