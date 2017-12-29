var Backbone = require('backbone');
var Router = require('../../../javascripts/cartodb3/routes/router');
Backbone.history.start({ pushState: false, hashChange: false, root: 'builder/id' });
Router.init();

// Mock this, because it fails
Router.getCurrentRoute = function () {
  return '/la/promosio';
};
