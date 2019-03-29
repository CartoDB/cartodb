var checkAndBuildOpts = require('builder/helpers/required-opts');
var LegendManager = require('./legend-manager');

var REQUIRED_OPTS = [
  'deepInsightsDashboard',
  'layerStyleCollection'
];

/**
 * Integration between embed view with cartodb.js and deep-insights.
 */
var EmbedIntegrations = function (opts) {
  checkAndBuildOpts(opts, REQUIRED_OPTS, this);

  this._getWidgets().each(function (model) {
    this._bindWidgetChanges(model);
  }, this);

  LegendManager.trackLegends(this._getLayers());
};

EmbedIntegrations.prototype._bindWidgetChanges = function (model) {
  // wait until the widget has the state from the url
  model.bind('change:hasInitialState', function (model) {
    model.bind('change:autoStyle', this._onWidgetAutoStyleChanged, this);

    // In order to trigger legend update, we wait until the cartocss from autostyle is applied
    if (model.isAutoStyle()) {
      if (!model.layerModel.get('initialStyle')) {
        model.layerModel.once('change:initialStyle', function () {
          this._onWidgetAutoStyleChanged(model);
        }, this);
      } else {
        this._onWidgetAutoStyleChanged(model);
      }
    }
  }, this);
};

EmbedIntegrations.prototype._onWidgetAutoStyleChanged = function (model) {
  var isAnyAutoStyleApplied = this._getWidgets().any(function (model) {
    return model.isAutoStyle();
  }, this);

  var isAutoStyleApplied = model.isAutoStyle();
  var layerId = model.layerModel.id;
  var layerStyle;

  if (isAutoStyleApplied) {
    LegendManager.updateLegends(layerId);

    layerStyle = this._layerStyleCollection.findById(layerId);
    // setting this in order to restore initial style when disable autostyle
    if (model.layerModel) {
      model.layerModel.attributes.initialStyle = layerStyle.get('cartocss');
    }
  } else if (!isAnyAutoStyleApplied) {
    LegendManager.resetLegends(layerId);
  }
};

EmbedIntegrations.prototype._getLayer = function (model) {
  return this.visMap().getLayerById(model.id);
};

EmbedIntegrations.prototype._getLayers = function (model) {
  return this.visMap().layers;
};

EmbedIntegrations.prototype.visMap = function () {
  return this._vis().map;
};

EmbedIntegrations.prototype._getWidgets = function () {
  return this._deepInsightsDashboard._dashboard.widgets._widgetsCollection;
};

EmbedIntegrations.prototype._vis = function () {
  return this._deepInsightsDashboard.getMap();
};

module.exports = EmbedIntegrations;
