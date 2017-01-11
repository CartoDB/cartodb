/**
 * Manages the tooltips for a map. It listens to changes on the collection
 * of layers and binds a new tooltip view/model to CartoDB.js whenever the
 * collection of layers changes
 */
var TooltipManager = function (deps) {
  if (!deps.visModel) throw new Error('visModel is required');
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.tooltipModel) throw new Error('tooltipModel is required');
  if (!deps.infowindowModel) throw new Error('infowindowModel is required');

  this._visModel = deps.visModel;
  this._mapModel = deps.mapModel;
  this._mapView = deps.mapView;
  this._tooltipModel = deps.tooltipModel;
  this._infowindowModel = deps.infowindowModel;

  this._featureOverBound = {};

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

    if (!this._featureOverBound[layerView.cid]) {
      this._bindFeatureOverEvent(layerView);
      this._featureOverBound[layerView.cid] = true;
    }

    layerModel.tooltip.fields.bind('reset', function () {
      this._reloadVis();
    }, this);
  }
};

TooltipManager.prototype._reloadVis = function (options) {
  options = options || {};
  this._visModel.reload(options);
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
      this._tooltipModel.setTooltipTemplate(layerModel.tooltip);
      this._tooltipModel.setPosition(pos);
      this._tooltipModel.updateContent(data);
      this._tooltipModel.show();
    } else {
      this._tooltipModel.hide();
    }
  }, this);

  layerView.bind('featureOut', function (e) {
    this._tooltipModel.hide();
  }, this);
};

TooltipManager.prototype._isFeatureInfowindowOpen = function (featureId) {
  return featureId && this._infowindowModel.getCurrentFeatureId() === featureId;
};

module.exports = TooltipManager;
