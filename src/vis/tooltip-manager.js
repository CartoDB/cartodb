var TooltipView = require('../geo/ui/tooltip-view');

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
  if (layerModel.tooltip) {
    var layerView = this._mapView.getLayerViewByLayerCid(layerModel.cid);

    if (!layerView.tooltipView) {
      this._addTooltipOverlay(layerView, layerModel);
      this._bindFeatureOverEvent(layerView);
    }
  }
};

TooltipManager.prototype._addTooltipOverlay = function (layerView, layerModel) {
  if (!layerView.tooltipView) {
    layerView.tooltipView = new TooltipView({
      mapView: this._mapView,
      layer: layerView,
      template: layerModel.tooltip.get('template'),
      position: 'bottom|right',
      vertical_offset: 10,
      horizontal_offset: 4,
      fields: layerModel.tooltip.get('fields'),
      omit_columns: ['cartodb_id']
    });
    this._mapView.addOverlay(layerView.tooltipView);

    // TODO: Test this
    layerView.bind('remove', function () {
      layerView.tooltipView.clean();
    }, this);
  }
};

TooltipManager.prototype._bindFeatureOverEvent = function (layerView) {
  layerView.bind('featureOver', function (e, latlng, pos, data, layerIndex) {
    var layerModel = layerView.model;
    if (layerModel.layers) {
      layerModel = layerModel.layers.at(layerIndex);
    }
    if (!layerModel) {
      throw new Error('featureOver event for layer ' + layerIndex + ' was captured but layerModel coudn\'t be retrieved');
    }

    if (layerModel.tooltip.hasFields()) {
      layerView.tooltipView.setTemplate(layerModel.tooltip.get('template'));
      layerView.tooltipView.setFields(layerModel.tooltip.get('fields'));
      layerView.tooltipView.setAlternativeNames(layerModel.tooltip.get('alternative_names'));
      layerView.tooltipView.enable();
    } else {
      layerView.tooltipView.disable();
    }
  }, this);
};

module.exports = TooltipManager;
