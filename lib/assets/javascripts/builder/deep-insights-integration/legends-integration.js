var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'diDashboardHelpers',
  'legendDefinitionsCollection'
];

/**
 *  Only manage **LEGENDS** actions between Deep-Insights (CARTO.js) and Builder
 *
 */

module.exports = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._legendDefinitionsCollection.on('add', this._onLegendDefinitionAdded, this);
    this._legendDefinitionsCollection.on('change', this._onLegendDefinitionChanged, this);
    this._legendDefinitionsCollection.on('remove', this._onLegendDefinitionRemoved, this);

    return this;
  },

  _onLegendDefinitionAdded: function (m) {
    var layerDefModel = m.layerDefinitionModel;
    var layer = this._diDashboardHelpers.getLayer(layerDefModel.id);
    var type = m.get('type');
    var legend;
    if (layer && layer.legends) {
      legend = layer.legends[type];
      if (legend) {
        legend.reset();
        legend.set(m.getAttributes());
        legend.show();
      }
    }
  },

  _onLegendDefinitionRemoved: function (m) {
    var layerDefModel = m.layerDefinitionModel;
    var layer = this._diDashboardHelpers.getLayer(layerDefModel.id);
    var type = m.get('type');
    var legend;
    if (layer && layer.legends) {
      legend = layer.legends[type];
      legend && legend.hide();
    }
  },

  _onLegendDefinitionChanged: function (m) {
    var layerDefModel = m.layerDefinitionModel;
    var layer = this._diDashboardHelpers.getLayer(layerDefModel.id);
    var type = m.get('type');
    var legend;
    if (layer && layer.legends) {
      legend = layer.legends[type];
      if (legend) {
        legend.reset();
        legend.set(m.getAttributes());
      }
    }
  }
};
