var Backbone = require('backbone');

var CustomRouter = Backbone.Router.extend({
  initialRouteHandled: null,
  currentRoute: []
});

var ROUTES = [
  ['root', ''],
  ['root', 'layers'],
  ['settings', 'settings'],
  ['layer', 'layer/:layerId']
];

var Router = (function () {
  var appRouter;
  var initialized = false;
  var routeModel;

  function generateRoute (routeName, model) {
    return function () {
      model.set('currentRoute', [routeName].concat(Array.prototype.slice.call(arguments)));
    };
  }

  return {
    init: function () {
      if (initialized) {
        throw new Error('Router can only be initialized once');
      }
      initialized = true;
      appRouter = new CustomRouter();
      routeModel = new Backbone.Model();
      ROUTES.forEach(function (route) {
        appRouter.route(route[1], generateRoute(route[0], routeModel));
      });
    },

    getRouter: function () {
      return appRouter;
    },

    getRouteModel: function () {
      return routeModel;
    }
  };
})();

module.exports = Router;
