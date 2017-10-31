var Engine = require('../../src/engine');

/**
 * Manages the infowindows for a map. It listens to events triggered by a
 * CartoDBLayerGroupView and updates models accordingly
 */
var InfowindowManager = function (deps, options) {
  deps = deps || {};
  options = options || {};
  if (!deps.engine) throw new Error('engine is required');
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.infowindowModel) throw new Error('infowindowModel is required');
  if (!deps.tooltipModel) throw new Error('tooltipModel is required');

  this._engine = deps.engine;
  this._mapModel = deps.mapModel;
  this._infowindowModel = deps.infowindowModel;
  this._tooltipModel = deps.tooltipModel;
  this._showEmptyFields = !!options.showEmptyFields;

  this._cartoDBLayerGroupView = null;
  this._cartoDBLayerModel = null;
  this.currentFeatureUniqueId = null;

  this._mapModel.on('change:popupsEnabled', this._onPopupsEnabledChanged, this);
};

InfowindowManager.prototype.start = function (cartoDBLayerGroupView) {
  this._cartoDBLayerGroupView = cartoDBLayerGroupView;
  cartoDBLayerGroupView.on('featureClick', this._onFeatureClicked, this);
};

InfowindowManager.prototype.stop = function () {
  if (this._cartoDBLayerGroupView) {
    this._cartoDBLayerGroupView.off('featureClick', this._onFeatureClicked, this);
    delete this._cartoDBLayerGroupView;
  }
  if (this._cartoDBLayerModel) {
    this._unbindLayerModel();
    delete this._cartoDBLayerModel;
  }
};

InfowindowManager.prototype._onFeatureClicked = function (featureClickEvent) {
  this._unbindLayerModel();

  this._cartoDBLayerModel = featureClickEvent.layer;
  var featureData = featureClickEvent.feature;
  var featureId = featureData.cartodb_id;
  var latLng = featureClickEvent.latlng;

  if (!this._mapModel.arePopupsEnabled() || !this._cartoDBLayerModel.infowindow.hasTemplate()) {
    return;
  }

  this._tooltipModel.hide();
  this._updateInfowindowModel(this._cartoDBLayerModel.infowindow);
  this._infowindowModel.setLatLng(latLng);
  this._showInfowindow(featureId);
  this._fetchAttributes(featureId);
};

InfowindowManager.prototype._showInfowindow = function (featureId) {
  this._bindLayerModel();
  this._infowindowModel.show();
  this._infowindowModel.setCurrentFeatureId(featureId);
};

InfowindowManager.prototype._hideInfowindow = function () {
  this._unbindLayerModel();
  this._infowindowModel.hide();
  this._infowindowModel.unsetCurrentFeatureId();
};

InfowindowManager.prototype._fetchAttributes = function (featureId) {
  var layerIndex = this._cartoDBLayerGroupView.model.getIndexOfLayerInLayerGroup(this._cartoDBLayerModel);
  var currentFeatureUniqueId = this._generateFeatureUniqueId(layerIndex, featureId);

  this._currentFeatureId = featureId || this._currentFeatureId;
  this._infowindowModel.setLoading();
  this.currentFeatureUniqueId = currentFeatureUniqueId;

  this._cartoDBLayerGroupView.model.fetchAttributes(layerIndex, this._currentFeatureId, function (attributes) {
    if (currentFeatureUniqueId !== this.currentFeatureUniqueId) {
      return;
    }

    if (attributes) {
      this._infowindowModel.updateContent(attributes, {
        showEmptyFields: this._showEmptyFields
      });
    } else {
      this._infowindowModel.setError();
    }
  }.bind(this));
};

InfowindowManager.prototype._bindLayerModel = function () {
  this._cartoDBLayerModel.on('destroy', this._hideInfowindow, this);
  this._cartoDBLayerModel.on('change:visible', this._hideInfowindow, this);
  this._cartoDBLayerModel.infowindow.on('change', this._updateInfowindowModel, this);
  this._cartoDBLayerModel.infowindow.fields.on('reset', this._onInfowindowTemplateFieldsReset, this);
  this._engine.on(Engine.Events.RELOAD_SUCCESS, this._onReloaded, this); // TODO: Add tests to check _onReloaded is being called.
};

InfowindowManager.prototype._unbindLayerModel = function () {
  if (this._cartoDBLayerModel) {
    this._cartoDBLayerModel.off('destroy', this._hideInfowindow, this);
    this._cartoDBLayerModel.off('change:visible', this._hideInfowindow, this);
    this._cartoDBLayerModel.infowindow.off('change', this._updateInfowindowModel, this);
    this._cartoDBLayerModel.infowindow.fields.off('reset', this._onInfowindowTemplateFieldsReset, this);
    this._engine.off(Engine.Events.RELOAD_SUCCESS, this._onReloaded, this);
  }
};

InfowindowManager.prototype._updateInfowindowModel = function (infowindowTemplate) {
  this._infowindowModel.setInfowindowTemplate(infowindowTemplate);
};

InfowindowManager.prototype._onInfowindowTemplateFieldsReset = function () {
  if (this._cartoDBLayerModel.infowindow.hasFields()) {
    this._updateInfowindowModel(this._cartoDBLayerModel.infowindow);
  } else {
    this._hideInfowindow();
  }
};

InfowindowManager.prototype._onReloaded = function () {
  if (this._cartoDBLayerModel && this._cartoDBLayerModel.infowindow.hasFields()) {
    this._fetchAttributes();
  }
};

InfowindowManager.prototype._onPopupsEnabledChanged = function () {
  if (this._mapModel.arePopupsDisabled()) {
    this._hideInfowindow();
  }
};

InfowindowManager.prototype._generateFeatureUniqueId = function (layerId, featureId) {
  return [layerId, featureId].join('_');
};

module.exports = InfowindowManager;
