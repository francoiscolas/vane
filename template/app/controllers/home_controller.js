var ApplicationController = require('./application_controller');

var HomeController = module.exports = ApplicationController.extend({

    index: function (params) {
        this.randomNumber = Math.round(Math.random() * 1000);
        this.render();
    }

});
