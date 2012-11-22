var vane = require('vane');

var ApplicationController = vane.Controller.extend({

//    currentUser: null,
//
//    initialize: function () {
//        //this.filter('requireUser');
//    },
//
//    requireUser: function (callback) {
//        var self = this;
//
//        if (self.session.has('user_id')) {
//            User.find(self.session.get('user_id')).toArray(function (users) {
//                self.currentUser = users[0] || null;
//                callback(!!self.currentUser);
//            });
//        } else {
//            callback(false);
//        }
//    }

});

module.exports = ApplicationController;
