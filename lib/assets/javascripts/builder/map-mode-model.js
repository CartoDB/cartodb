var Backbone = require('backbone');

var VIEWING_MODE = 'viewing';
var DRAWING_FEATURE_MODE = 'drawing';
var EDITING_FEATURE_MODE = 'editing';

var MapMode = Backbone.Model.extend({
  defaults: {
    mode: VIEWING_MODE
  },

  enterViewingMode: function () {
    delete this._featureDefinition;
    this.set('mode', VIEWING_MODE);
  },

  enterDrawingFeatureMode: function (feature) {
    this._featureDefinition = feature;
    this.set('mode', DRAWING_FEATURE_MODE);
  },

  enterEditingFeatureMode: function (feature) {
    this._featureDefinition = feature;
    this.set('mode', EDITING_FEATURE_MODE);
  },

  getFeatureDefinition: function () {
    return this._featureDefinition;
  },

  isViewingMode: function () {
    return this._isMode(VIEWING_MODE);
  },

  isDrawingFeatureMode: function () {
    return this._isMode(DRAWING_FEATURE_MODE);
  },

  isEditingFeatureMode: function () {
    return this._isMode(EDITING_FEATURE_MODE);
  },

  bindRouteEvents: function (routeModel) {
    this.listenTo(routeModel, 'change:currentRoute', this._handleRoute, this);
  },

  _handleRoute: function (routeModel) {
    var currentRoute = routeModel.get('currentRoute');
    var routeName = currentRoute[0];

    if (routeName !== 'edit_feature' &&
        routeName.indexOf('add_feature_') !== 0) {
      this.enterViewingMode();
    }
  },

  _isMode: function (mode) {
    return this.get('mode') === mode;
  }
});

module.exports = MapMode;
