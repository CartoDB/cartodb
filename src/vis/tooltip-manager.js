var TooltipModel = require('../geo/ui/tooltip-model');
var TooltipView = require('../geo/ui/tooltip-view');

/**
 * Manages the tooltips for a map. It listens to changes on the collection
 * of layers and binds a new tooltip view/model to CartoDB.js whenever the
 * collection of layers changes
 */
var TooltipManager = function (deps) {
  if (!deps.visModel) throw new Error('visModel is required');
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.infowindowModel) throw new Error('infowindowModel is required');

  this._visModel = deps.visModel;
  this._mapModel = deps.mapModel;
  this._mapView = deps.mapView;
  this._infowindowModel = deps.infowindowModel;

  this._mapModel.layers.bind('reset', this._addTooltipForLayers, this);
  this._mapModel.layers.bind('add', this._addTooltipForLayer, this);
  this._addTooltipForLayers();
};

TooltipManager.prototype._addTooltipForLayers = function () {
  this._mapModel.layers.each(this._addTooltipForLayer, this);
};

TooltipManager.prototype._addTooltipForLayer = function (layerModel) {
  if (layerModel.tooltip) {
    var layerView = this._mapView.getLayerViewByLayerCid(layerModel.cid);

    layerModel.tooltip.fields.bind('reset', function () {
      this._reloadVis();
    }, this);

    if (!layerView.tooltipView) {
      this._addTooltipOverlay(layerView, layerModel);
      this._bindFeatureOverEvent(layerView);
    }
  }
};

TooltipManager.prototype._reloadVis = function (options) {
  options = options || {};
  this._visModel.reload(options);
};

TooltipManager.prototype._addTooltipOverlay = function (layerView, layerModel) {
  if (!layerView.tooltipView) {
    var tooltipModel = new TooltipModel({
      offset: [4, 10]
    });

    layerView.tooltipView = new TooltipView({
      model: tooltipModel,
      mapView: this._mapView,
      layerView: layerView
    });

    this._mapView.addOverlay(layerView.tooltipView);
  }
};

TooltipManager.prototype._bindFeatureOverEvent = function (layerView) {
  layerView.bind('featureOver', function (e, latlng, pos, data, layerIndex) {
    var layerModel = layerView.model.getLayerAt(layerIndex);
    if (!layerModel) {
      throw new Error('featureOver event for layer ' + layerIndex + ' was captured but layerModel coudn\'t be retrieved');
    }

    if (this._mapModel.arePopupsEnabled() &&
      layerModel.tooltip.hasTemplate() &&
      !this._isFeatureInfowindowOpen(data.cartodb_id)) {
      layerView.tooltipView.model.set('pos', pos);
      layerView.tooltipView.model.set('fields', layerModel.tooltip.fields.toJSON());
      layerView.tooltipView.model.set('template', layerModel.tooltip.get('template'));
      layerView.tooltipView.model.set('alternative_names', layerModel.tooltip.get('alternative_names'));
      layerView.tooltipView.model.updateContent(data);
      layerView.tooltipView.model.set('visible', true);
    } else {
      layerView.tooltipView.model.set('visible', false);
    }
  }, this);

  layerView.bind('featureOut', function (e) {
    layerView.tooltipView.model.set('visible', false);
  }, this);
};

TooltipManager.prototype._isFeatureInfowindowOpen = function (featureId) {
  return featureId && this._infowindowModel.getCurrentFeatureId() === featureId;
};

module.exports = TooltipManager;
