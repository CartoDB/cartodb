/**
 * Manages the tooltips for a map. It listens to changes on the collection
 * of layers and binds a new tooltip view/model to CartoDB.js whenever the
 * collection of layers changes
 */
var TooltipManager = function (deps) {
  if (!deps.visModel) throw new Error('visModel is required');
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.tooltipModel) throw new Error('tooltipModel is required');
  if (!deps.infowindowModel) throw new Error('infowindowModel is required');

  this._visModel = deps.visModel;
  this._mapModel = deps.mapModel;
  this._tooltipModel = deps.tooltipModel;
  this._infowindowModel = deps.infowindowModel;
};

TooltipManager.prototype.start = function (cartoDBLayerGroupView) {
  this._cartoDBLayerGroupView = cartoDBLayerGroupView;
  this._cartoDBLayerGroupView.on('featureOver', this._onFeatureOvered, this);
  this._cartoDBLayerGroupView.on('featureOut', this._onFeatureOut, this);
};

TooltipManager.prototype.stop = function () {
  this._cartoDBLayerGroupView.off('featureOver', this._onFeatureOvered, this);
  this._cartoDBLayerGroupView.off('featureOut', this._onFeatureOut, this);
};

TooltipManager.prototype._onFeatureOvered = function (featureOverEvent) {
  var layerModel = featureOverEvent.layer;
  if (!layerModel) {
    throw new Error('featureOver event for layer ' + featureOverEvent.layerIndex + ' was captured but layerModel coudn\'t be retrieved');
  }

  if (this._mapModel.arePopupsEnabled() &&
    layerModel.tooltip.hasTemplate() &&
    !this._isFeatureInfowindowOpen(featureOverEvent.feature.cartodb_id)) {
    this._tooltipModel.setTooltipTemplate(layerModel.tooltip);
    this._tooltipModel.setPosition(featureOverEvent.position);
    this._tooltipModel.updateContent(featureOverEvent.feature);
    this._tooltipModel.show();
  } else {
    this._tooltipModel.hide();
  }
};

TooltipManager.prototype._onFeatureOut = function () {
  this._tooltipModel.hide();
};

TooltipManager.prototype._isFeatureInfowindowOpen = function (featureId) {
  return featureId && this._infowindowModel.getCurrentFeatureId() === featureId;
};

module.exports = TooltipManager;
