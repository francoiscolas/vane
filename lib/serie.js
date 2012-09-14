(function () {

    var serie = function (/*Function... functions*/) {
        var functions = arguments;
        var i         = 0;

        (function () {
            var f    = functions[i++];
            var args = Array.prototype.slice.call(arguments, 0).concat(arguments.callee);
            if (typeof f === 'function') f.apply(null, args);
        })();
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = serie;
    else
        this.serie = serie;

})();
