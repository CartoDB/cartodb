var Backbone = require('backbone');

var CustomRouter = Backbone.Router.extend({
  routes: {
    'settings': 'settings'
  },

  settings: () => console.log('settings route, defined on router')
});

var Router = (function () {
  var appRouter;
  var initialized = false;

  return {
    init: function () {
      if (initialized) {
        throw new Error('You cant initialize the router again');
      }
      initialized = true;
      appRouter = new CustomRouter();
    },

    getRouter: function () {
      return appRouter;
    }
  };
})();

module.exports = Router;
