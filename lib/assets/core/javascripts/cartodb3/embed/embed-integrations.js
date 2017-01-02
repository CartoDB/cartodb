var checkAndBuildOpts = require('../helpers/required-opts');
var LegendManager = require('./legend-manager');

var REQUIRED_OPTS = [
  'deepInsightsDashboard'
];

/**
 * Integration between embed view with cartodb.js and deep-insights.
 */
var F = function (opts) {
  checkAndBuildOpts(opts, REQUIRED_OPTS, this);

  this._getWidgets().each(function (m) {
    this._bindWidgetChanges(m);
  }, this);

  LegendManager.trackLegends(this._getLayers());
};

F.prototype._bindWidgetChanges = function (m) {
  // wait until the widget has the state from the url
  m.bind('change:hasInitialState', function (m) {
    m.bind('change:autoStyle', this._onWidgetAutoStyleChanged, this);

    // In order to trigger legend update, we wait until the cartocss from autostyle is applied
    if (m.isAutoStyle()) {
      if (!m.dataviewModel.layer.get('initialStyle')) {
        m.dataviewModel.layer.once('change:initialStyle', function () {
          this._onWidgetAutoStyleChanged(m);
        }, this);
      } else {
        this._onWidgetAutoStyleChanged(m);
      }
    }
  }, this);
};

F.prototype._onWidgetAutoStyleChanged = function (m) {
  var isAnyAutoStyleApplied = this._getWidgets().any(function (m) {
    return m.isAutoStyle();
  }, this);

  var isAutoStyleApplied = m.isAutoStyle();
  var layerId = m.dataviewModel.layer.id;

  if (isAutoStyleApplied) {
    LegendManager.updateLegends(layerId);
  } else if (!isAnyAutoStyleApplied) {
    LegendManager.resetLegends(layerId);
  }
};

F.prototype._getLayer = function (m) {
  return this.visMap().getLayerById(m.id);
};

F.prototype._getLayers = function (m) {
  return this.visMap().layers;
};

F.prototype.visMap = function () {
  return this._vis().map;
};

F.prototype._getWidgets = function (m) {
  return this._deepInsightsDashboard._dashboard.widgets._widgetsCollection;
};

F.prototype._vis = function () {
  return this._deepInsightsDashboard.getMap();
};

module.exports = F;
