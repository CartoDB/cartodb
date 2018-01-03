var Backbone = require('backbone');
var _ = require('underscore');
var populateRoute = require('./populate-route');

var ROUTE_LAYERS = 'layers';
var ROUTE_SETTINGS = 'settings';
var BASE_LAYER_ROUTE = 'layer/:layerId';
var ROUTE_BASEMAP = 'basemap';
var ROUTE_LAYER_DATA_TAB = BASE_LAYER_ROUTE + '/data';
var ROUTE_LAYER_ANALYSES_TAB = BASE_LAYER_ROUTE + '/analyses(/:nodeId)';
var ROUTE_LAYER_STYLE_TAB = BASE_LAYER_ROUTE + '/style';
var ROUTE_LAYER_POPUPS_TAB = BASE_LAYER_ROUTE + '/popups';
var ROUTE_LAYER_LEGENDS_TAB = BASE_LAYER_ROUTE + '/legends';
var ROUTE_MODAL = 'modal';
var ROUTE_ADD_POINT = BASE_LAYER_ROUTE + '/add/point';
var ROUTE_ADD_LINE = BASE_LAYER_ROUTE + '/add/line';
var ROUTE_ADD_POLYGON = BASE_LAYER_ROUTE + '/add/polygon';
var EDIT_FEATURE = BASE_LAYER_ROUTE + '/edit/:featureId';

var ROUTES = [
  ['root', ''],
  ['root', ROUTE_LAYERS],
  ['settings', ROUTE_SETTINGS],
  ['layer', BASE_LAYER_ROUTE],
  ['layer_data', ROUTE_LAYER_DATA_TAB],
  ['layer_analyses', ROUTE_LAYER_ANALYSES_TAB],
  ['layer_style', ROUTE_LAYER_STYLE_TAB],
  ['layer_style', BASE_LAYER_ROUTE],
  ['layer_popups', ROUTE_LAYER_POPUPS_TAB],
  ['layer_legends', ROUTE_LAYER_LEGENDS_TAB],
  ['add_feature_point', ROUTE_ADD_POINT],
  ['add_feature_line', ROUTE_ADD_LINE],
  ['add_feature_polygon', ROUTE_ADD_POLYGON],
  ['edit_feature', EDIT_FEATURE],
  ['modal', ROUTE_MODAL],
  ['basemap', ROUTE_BASEMAP]
];

var Router = (function () {
  var appRouter;
  var initialized = false;
  var routeModel = new Backbone.Model();
  // keep last route before a modal, so we can replace /modal with it
  var previousRoute;
  // Routes that should not be kept as a "previous" route
  var UNSTORABLE_ROUTES;

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
      appRouter = new Backbone.Router();
      ROUTES.forEach(function (route) {
        appRouter.route(route[1], generateRoute(route[0], routeModel));
      });
      UNSTORABLE_ROUTES = [
        ROUTE_ADD_POINT,
        ROUTE_ADD_LINE,
        ROUTE_ADD_POLYGON,
        EDIT_FEATURE
      ].map(function (route) {
        return appRouter._routeToRegExp(route);
      });
    },

    getRouter: function () {
      return appRouter;
    },

    getRouteModel: function () {
      return routeModel;
    },

    goBack: function () {
      Backbone.history.history.back();
    },

    goToDefaultRoute: function () {
      this.navigate('');
    },

    replaceWithRoot: function () {
      this.navigate('', { replace: true });
    },

    goToBaseMap: function (layerId) {
      this.navigate(ROUTE_BASEMAP);
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

    goToPopupsTab: function (layerId) {
      this.navigate(populateRoute(ROUTE_LAYER_POPUPS_TAB, { layerId: layerId }));
    },

    goToLegendsTab: function (layerId) {
      this.navigate(populateRoute(ROUTE_LAYER_LEGENDS_TAB, { layerId: layerId }));
    },

    getCurrentRoute: function () {
      return Backbone.history.getPath();
    },

    saveCurrentRoute: function () {
      var currentRoute = this.getCurrentRoute();
      var canBeSaved = !UNSTORABLE_ROUTES.some(function (regex) {
        return regex.test(currentRoute);
      });

      if (canBeSaved === true) {
        previousRoute = currentRoute;
      }
    },

    pushModal: function () {
      this.saveCurrentRoute();
      this.navigate(ROUTE_MODAL);
    },

    popModal: function () {
      this.navigate(previousRoute, { trigger: false, replace: true });
      previousRoute = null;
    },

    addPoint: function (layerId) {
      this._addFeature(ROUTE_ADD_POINT, layerId);
    },

    addLine: function (layerId) {
      this._addFeature(ROUTE_ADD_LINE, layerId);
    },

    addPolygon: function (layerId) {
      this._addFeature(ROUTE_ADD_POLYGON, layerId);
    },

    goToPreviousRoute: function () {
      if (previousRoute !== null) {
        this.navigate(previousRoute, { replace: true });
        previousRoute = null;
      } else {
        Backbone.history.history.back();
      }
    },

    _addFeature: function (route, layerId) {
      this.saveCurrentRoute();
      this.navigate(populateRoute(route, {
        layerId: layerId
      }));
    },

    editFeature: function (feature, replace) {
      var featureId = feature.get('cartodb_id');
      var layerId = feature.getLayerId();
      replace = replace || false;

      this.saveCurrentRoute();

      this.navigate(populateRoute(EDIT_FEATURE, {
        layerId: layerId,
        featureId: featureId
      }));
    },

    navigate: function (route, options) {
      options = _.extend({
        trigger: true
      }, options);

      appRouter.navigate(route, options);
    },

    replaceState: function (route) {
      var root = Backbone.history.root;
      var newRoute = root + route;

      window.history.replaceState(null, null, newRoute);
    }
  };
})();

module.exports = Router;
