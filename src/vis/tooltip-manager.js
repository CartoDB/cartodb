var Tooltip = require('../geo/ui/tooltip');

/**
 * Manages the tooltips for a map. It listens to changes on the collection
 * of layers and binds a new tooltip view/model to CartoDB.js whenever the
 * collection of layers changes
 */
var TooltipManager = function (vis) {
  this._vis = vis;
};

TooltipManager.prototype.manage = function (mapView, map) {
  this._mapView = mapView;
  this._map = map;

  this._map.layers.bind('reset', function (layers) {
    layers.each(this._addTooltipForLayer, this);
  }, this);
  this._map.layers.bind('add', this._addTooltipForLayer, this);
};

TooltipManager.prototype._addTooltipForLayer = function (layerModel) {
  if (layerModel.getTooltipData && layerModel.getTooltipData()) {
    var layerView = this._mapView.getLayerViewByLayerCid(layerModel.cid);

    this._addTooltipOverlay(layerView, layerModel);
    this._bindFeatureOverEvent(layerView);
  }
};

TooltipManager.prototype._addTooltipOverlay = function (layerView, layerModel) {
  var tooltipView = layerView.tooltipView;
  if (!tooltipView) {
    var tooltipData = layerModel.getTooltipData();
    layerView.tooltipView = tooltipView = new Tooltip({
      mapView: this._mapView,
      layer: layerView,
      template: tooltipData.template,
      position: 'bottom|right',
      vertical_offset: 10,
      horizontal_offset: 4,
      fields: tooltipData.fields,
      omit_columns: ['cartodb_id']
    });
    this._mapView.addOverlay(tooltipView);

    // TODO: Test this
    layerView.bind('remove', function () {
      tooltipView.clean();
    });
  }
};

TooltipManager.prototype._bindFeatureOverEvent = function (layerView) {
  var tooltipView = layerView.tooltipView;

  var onFeatureOver = function (e, latlng, pos, data, layerIndex) {
    var layerModel = layerView.model;
    if (layerModel.layers) {
      layerModel = layerModel.layers.at(layerIndex);
    }
    if (!layerModel) {
      throw new Error('featureOver event for layer ' + layerIndex + ' was captured but layerModel coudn\'t be retrieved');
    }

    var tooltipData = layerModel.getTooltipData();
    if (tooltipData) {
      tooltipView.setTemplate(tooltipData.template);
      tooltipView.setFields(tooltipData.fields);
      tooltipView.setAlternativeNames(tooltipData.alternative_names);
      tooltipView.enable();
    } else {
      tooltipView.disable();
    }
  };
  layerView.unbind('featureOver', onFeatureOver);
  layerView.bind('featureOver', onFeatureOver);
};

module.exports = TooltipManager;
