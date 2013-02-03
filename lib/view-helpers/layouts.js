var _ = require('underscore');

module.exports = {

    render: function (partial, options) {
        var layout = (options && options.layout) || null;

        if (partial.indexOf('/') < 0)
            partial = this.controller.name + '/_' + partial;
       
        var view = this.controller.application.views.create(layout, partial, {controller: this.controller});

        if (view !== null)
            return view.render(options);
        else
            return null;
    },

    yield: function (contentFor) {
        return this.view.viewTpl(_.extend({contentFor: contentFor}, this));
    }

};
