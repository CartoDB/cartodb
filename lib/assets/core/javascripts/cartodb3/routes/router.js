var Backbone = require('backbone');

var CustomRouter = Backbone.Router.extend({
  initialRouteHandled: null,
  currentRoute: []
});

var BASE_LAYER_ROUTE = 'layer/:layerId';

var ROUTES = [
  ['root', ''],
  ['root', 'layers'],
  ['settings', 'settings'],
  ['layer', BASE_LAYER_ROUTE],
  ['layer_data', BASE_LAYER_ROUTE + '/data'],
  ['layer_analyses', BASE_LAYER_ROUTE + '/analyses(/:nodeId)'],
  ['layer_style', BASE_LAYER_ROUTE + '/style'],
  ['layer_interaction', BASE_LAYER_ROUTE + '/interaction'],
  ['layer_legend', BASE_LAYER_ROUTE + '/legend'],
  ['modal', 'modal(/:modalId)']
];

var Router = (function () {
  var appRouter;
  var initialized = false;
  var routeModel;
  // keep last route before a modal, so we can replace /modal with it
  var formerRoute;

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
      window.appRouter = appRouter = new CustomRouter();
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
    },

    goToLayer: function (layerId, tabOptions, options) {
      options = options || { trigger: true };
      var url = 'layer/' + layerId;
      if (tabOptions) {
        url += '/' + tabOptions.tab;

        if (tabOptions.tab === 'analyses' && tabOptions.nodeId) {
          url += '/' + tabOptions.nodeId;
        }
      }
      appRouter.navigate(url, options);
    },

    goToDefaultRoute: function () {
      appRouter.navigate('', { trigger: true });
    },

    goToLayerList: function () {
      appRouter.navigate('layers', { trigger: true });
    },

    goToSettings: function () {
      appRouter.navigate('settings', { trigger: true });
    },

    goToDataTab: function (layerId) {
      appRouter.navigate('layer/' + layerId + '/data', { trigger: true });
    },

    goToAnalysisTab: function (layerId) {
      appRouter.navigate('layer/' + layerId + '/analyses', { trigger: true });
    },

    goToStyleTab: function (layerId) {
      appRouter.navigate('layer/' + layerId + '/style', { trigger: true });
    },

    goToInteractionTab: function (layerId) {
      appRouter.navigate('layer/' + layerId + '/interaction', { trigger: true });
    },

    goToLegendTab: function (layerId) {
      appRouter.navigate('layer/' + layerId + '/legend', { trigger: true });
    },

    pushModal: function () {
      formerRoute = location.pathname.split(Backbone.history.root)[1];
      appRouter.navigate('modal', { trigger: true });
    },

    popModal: function () {
      appRouter.navigate(formerRoute, { replace: true });
    }
  };
})();

module.exports = Router;
