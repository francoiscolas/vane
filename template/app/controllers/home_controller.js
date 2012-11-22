var ApplicationController = require('./application_controller');

var HomeController = ApplicationController.extend({

    initialize: function () {
//        this.skipFilter('requireUser');
    },

    index: function (params) {
        this.randomNumber = Math.round(Math.random() * 1000);
        this.render();
    }

});

module.exports = HomeController;
