var Backbone = require('backbone');
var _ = require('underscore');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var populateRoute = require('./populate-route');

var ROUTE_LAYERS = 'layers';
var ROUTE_WIDGETS = 'widgets';
var ROUTE_SETTINGS = 'settings';
var BASE_LAYER_ROUTE = 'layer/:layerId';
var ROUTE_WIDGET = 'widget/:widgetId';
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

var REQUIRED_OPTS = [
  'modals',
  'editorModel',
  'widgetDefinitionsCollection',
  'handleModalsRoute',
  'handleAnalysesRoute',
  'handleWidgetRoute'
];

var ROUTES = [
  ['root', ''],
  ['root', ROUTE_LAYERS],
  ['settings', ROUTE_SETTINGS],
  ['layer', BASE_LAYER_ROUTE],
  ['widgets', ROUTE_WIDGETS],
  ['widget', ROUTE_WIDGET],
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

module.exports = (function () {
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
    init: function (options) {
      if (initialized) {
        throw new Error('Router can only be initialized once');
      }

      checkAndBuildOpts(options, REQUIRED_OPTS, this);

      var self = this;
      initialized = true;
      this.appRouter = new Backbone.Router();

      ROUTES.forEach(function (route) {
        self.appRouter.route(route[1], generateRoute(route[0], routeModel));
      });
      UNSTORABLE_ROUTES = [
        ROUTE_ADD_POINT,
        ROUTE_ADD_LINE,
        ROUTE_ADD_POLYGON,
        EDIT_FEATURE
      ].map(function (route) {
        return self.appRouter._routeToRegExp(route);
      });

      this._initBinds();
    },

    _initBinds: function () {
      this.getRouteModel().on('change:currentRoute', this._onChangeRoute, this);
    },

    _onChangeRoute: function (routeModel) {
      var currentRoute = routeModel.get('currentRoute');

      if (!currentRoute) return;

      this._handleModalsRoute(currentRoute, this._modals);
      this._handleAnalysesRoute(currentRoute);
      this._handleWidgetRoute(currentRoute, this._widgetDefinitionsCollection);

      this._editorModel.set('edition', false);
    },

    getRouter: function () {
      return this.appRouter;
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

    goToAnalysisTab: function (layerId, options) {
      this.navigate(populateRoute(ROUTE_LAYER_ANALYSES_TAB, { layerId: layerId }), options);
    },

    goToAnalysisNode: function (layerId, nodeId, options) {
      var args = { layerId: layerId, nodeId: nodeId };

      this.navigate(populateRoute(ROUTE_LAYER_ANALYSES_TAB, args), options);
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

    goToWidgetList: function () {
      this.navigate(ROUTE_WIDGETS);
    },

    goToWidget: function (widgetId) {
      var route = routeModel.get('currentRoute');
      var options = {};

      if (_.isArray(route) && route[0] === 'widget') {
        options.replace = true;
      }

      this.navigate(populateRoute(ROUTE_WIDGET, { widgetId: widgetId }), options);
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

    addPoint: function (layerId) {
      this._addFeature(ROUTE_ADD_POINT, layerId);
    },

    addLine: function (layerId) {
      this._addFeature(ROUTE_ADD_LINE, layerId);
    },

    addPolygon: function (layerId) {
      this._addFeature(ROUTE_ADD_POLYGON, layerId);
    },

    goToPreviousRoute: function (options) {
      previousRoute = previousRoute || options.fallback;

      if (previousRoute !== null && previousRoute !== undefined) {
        this.navigate(previousRoute, options.options);
        previousRoute = null;
      } else {
        Backbone.history.history.back();
      }
    },

    _addFeature: function (route, layerId) {
      this.navigate(populateRoute(route, { layerId: layerId }));
    },

    editFeature: function (feature) {
      var featureId = feature.get('cartodb_id');
      var layerId = feature.getLayerId();

      this.navigate(populateRoute(EDIT_FEATURE, {
        layerId: layerId,
        featureId: featureId
      }));
    },

    navigate: function (route, options) {
      this.saveCurrentRoute();

      options = _.extend({
        trigger: true
      }, options);

      this.appRouter.navigate(route, options);
    },

    replaceState: function (route) {
      var root = Backbone.history.root;
      var newRoute = root + route;

      window.history.replaceState(null, null, newRoute);
    }
  };
})();
