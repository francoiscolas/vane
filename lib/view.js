var _ = require('underscore');

var View = function (layout, view, options) {
    options || (options = {});

    this.layoutTpl  = layout;
    this.viewTpl    = view;
    this.name       = options.name;
    this.controller = options.controller;
};

View.helpers = _.extend({},
    require('./view-helpers/layouts'),
    require('./view-helpers/assets'),
    require('./view-helpers/i18n')
);

View.prototype = {

    render: function (options) {
        var context = _.extend({
            view      : this,
            controller: this.controller,
            params    : this.controller.params,
            request   : this.controller.request
        }, View.helpers, this.controller.view, options);

        if (this.layoutTpl)
            return this.layoutTpl(context);
        else
            return this.viewTpl(context);
    }

};

module.exports = View;
