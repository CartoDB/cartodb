var _ = require('underscore');

/**
 * Manages the tooltips for a map. It listens to events triggered by a
 * CartoDBLayerGroupView and updates models accordingly
 */
var TooltipManager = function (deps) {
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.tooltipModel) throw new Error('tooltipModel is required');
  if (!deps.infowindowModel) throw new Error('infowindowModel is required');

  this._mapModel = deps.mapModel;
  this._tooltipModel = deps.tooltipModel;
  this._infowindowModel = deps.infowindowModel;

  this._layersBeingFeaturedOvered = {};
};

TooltipManager.prototype.start = function (cartoDBLayerGroupView) {
  this._cartoDBLayerGroupView = cartoDBLayerGroupView;
  this._cartoDBLayerGroupView.on('featureOver', this._onFeatureOvered, this);
  this._cartoDBLayerGroupView.on('featureOut', this._onFeatureOut, this);
};

TooltipManager.prototype.stop = function () {
  if (this._cartoDBLayerGroupView) {
    this._cartoDBLayerGroupView.off('featureOver', this._onFeatureOvered, this);
    this._cartoDBLayerGroupView.off('featureOut', this._onFeatureOut, this);
  }
};

TooltipManager.prototype._onFeatureOvered = function (featureOverEvent) {
  var layerModel = featureOverEvent.layer;
  var featureData = featureOverEvent.feature;
  var featureId = featureData.cartodb_id;

  if (!layerModel) {
    throw new Error('featureOver event for layer ' + featureOverEvent.layerIndex + ' was captured but layerModel coudn\'t be retrieved');
  }

  var showTooltip = this._mapModel.arePopupsEnabled() && layerModel.tooltip.hasTemplate() &&
    !this._isFeatureInfowindowOpen(layerModel, featureId);
  if (showTooltip) {
    this._markLayerAsFeatureOvered(layerModel);
    this._tooltipModel.setTooltipTemplate(layerModel.tooltip);
    this._tooltipModel.setPosition(featureOverEvent.position);
    this._tooltipModel.updateContent(featureData);
    this._showTooltip(layerModel);
  } else {
    this._unmarkLayerAsFeatureOvered(layerModel);
    this._hideTooltip(layerModel);
  }
};

TooltipManager.prototype._onFeatureOut = function (featureOutEvent) {
  var layerModel = featureOutEvent.layer;
  this._unmarkLayerAsFeatureOvered(layerModel);
  if (this._noLayerIsBeingFeatureOvered()) {
    this._hideTooltip(layerModel);
  }
};

TooltipManager.prototype._showTooltip = function (layerModel) {
  this._tooltipModel.show();
  layerModel.on('change:visible', this._onLayerVisibilityChanged, this);
};

TooltipManager.prototype._hideTooltip = function (layerModel) {
  this._tooltipModel.hide();
  layerModel.off('change:visible', this._onLayerVisibilityChanged, this);
};

TooltipManager.prototype._onLayerVisibilityChanged = function (layerModel) {
  this._hideTooltip(layerModel);
};

TooltipManager.prototype._markLayerAsFeatureOvered = function (layerModel) {
  this._layersBeingFeaturedOvered[layerModel.cid] = true;
};

TooltipManager.prototype._unmarkLayerAsFeatureOvered = function (layerModel) {
  this._layersBeingFeaturedOvered[layerModel.cid] = false;
};

TooltipManager.prototype._noLayerIsBeingFeatureOvered = function () {
  return _.all(this._layersBeingFeaturedOvered, function (value, key) {
    return !value;
  }, this);
};

TooltipManager.prototype._isFeatureInfowindowOpen = function (layerModel, featureId) {
  return featureId && this._infowindowModel.getCurrentFeatureId() === featureId &&
    this._infowindowModel.isVisible() &&
    this._infowindowModel.hasInfowindowTemplate(layerModel.infowindow);
};

module.exports = TooltipManager;
