var ApplicationController = require('./application_controller');

var HomeController = ApplicationController.extend({

    initialize: function () {
//        this.skipFilter('requireUser');
    },

    index: function (params) {
        this.render({
            randomNumber: Math.round(Math.random() * 1000)
        });
    }

});

module.exports = HomeController;
