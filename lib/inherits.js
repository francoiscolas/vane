(function () {

    var inherits = module.exports = function (prototype) {
        var parent = this;
        var child  = function () {
            return parent.apply(this, arguments);
        };

        // parent's static properties
        for (var property in parent)
            child[property] = parent[property];

        // parent's prototype properties
        child.prototype = Object.create(parent.prototype);

        // prototype properties
        if (prototype)
            for (var property in prototype)
                child.prototype[property] = prototype[property];
        child.prototype.constructor = child;
        child.prototype._class = child;
        child.prototype._super = parent;

        return child;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = inherits;
    else
        this.inherits = inherits;

})();
