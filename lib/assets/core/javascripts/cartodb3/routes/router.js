var Backbone = require('backbone');
var _ = require('underscore');
var populateRoute = require('./populate-route');

var ROUTE_LAYERS = 'layers';
var ROUTE_SETTINGS = 'settings';
var BASE_LAYER_ROUTE = 'layer/:layerId';
var ROUTE_LAYER_DATA_TAB = BASE_LAYER_ROUTE + '/data';
var ROUTE_LAYER_ANALYSES_TAB = BASE_LAYER_ROUTE + '/analyses(/:nodeId)';
var ROUTE_LAYER_STYLE_TAB = BASE_LAYER_ROUTE + '/style';
var ROUTE_LAYER_INTERACTION_TAB = BASE_LAYER_ROUTE + '/interaction';
var ROUTE_LAYER_LEGEND_TAB = BASE_LAYER_ROUTE + '/legend';
var ROUTE_MODAL = 'modal';

var ROUTES = [
  ['root', ''],
  ['root', ROUTE_LAYERS],
  ['settings', ROUTE_SETTINGS],
  ['layer', BASE_LAYER_ROUTE],
  ['layer_data', ROUTE_LAYER_DATA_TAB],
  ['layer_analyses', ROUTE_LAYER_ANALYSES_TAB],
  ['layer_style', ROUTE_LAYER_STYLE_TAB],
  ['layer_interaction', ROUTE_LAYER_INTERACTION_TAB],
  ['layer_legend', ROUTE_LAYER_LEGEND_TAB],
  ['modal', ROUTE_MODAL]
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
      window.appRouter = appRouter = new Backbone.Router();
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

    goToDefaultRoute: function () {
      this.navigate('');
    },

    goToLayerList: function () {
      this.navigate(ROUTE_LAYERS);
    },

    goToSettings: function () {
      this.navigate(ROUTE_SETTINGS);
    },

    goToDataTab: function (layerId) {
      this.navigate(populateRoute(ROUTE_LAYER_DATA_TAB, { layerId: layerId }));
    },

    goToAnalysisTab: function (layerId) {
      this.navigate(populateRoute(ROUTE_LAYER_ANALYSES_TAB, { layerId: layerId }));
    },

    goToAnalysisNode: function (layerId, nodeId) {
      this.navigate(populateRoute(ROUTE_LAYER_ANALYSES_TAB, { layerId: layerId, nodeId: nodeId }));
    },

    goToStyleTab: function (layerId) {
      this.navigate(populateRoute(ROUTE_LAYER_STYLE_TAB, { layerId: layerId }));
    },

    goToInteractionTab: function (layerId) {
      this.navigate(populateRoute(ROUTE_LAYER_INTERACTION_TAB, { layerId: layerId }));
    },

    goToLegendTab: function (layerId) {
      this.navigate(populateRoute(ROUTE_LAYER_LEGEND_TAB, { layerId: layerId }));
    },

    pushModal: function () {
      formerRoute = location.pathname.split(Backbone.history.root)[1];
      this.navigate(ROUTE_MODAL);
    },

    popModal: function () {
      this.navigate(formerRoute, { trigger: false, replace: true });
    },

    navigate: function (route, options) {
      options = _.extend({
        trigger: true
      }, options);

      appRouter.navigate(route, options);
    }

  };
})();

module.exports = Router;
