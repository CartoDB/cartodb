/**
 * Manages the infowindows for a map. It listens to changes on the collection
 * of layers and binds a new infowindow view/model to CartoDB.js whenever the
 * collection of layers changes
 */
var InfowindowManager = function (deps, options) {
  deps = deps || {};
  options = options || {};
  if (!deps.visModel) throw new Error('visModel is required');
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.infowindowModel) throw new Error('infowindowModel is required');
  if (!deps.tooltipModel) throw new Error('tooltipModel is required');

  this._vis = deps.visModel;
  this._mapModel = deps.mapModel;
  this._infowindowModel = deps.infowindowModel;
  this._tooltipModel = deps.tooltipModel;
  this._showEmptyFields = !!options.showEmptyFields;

  this._cartoDBLayerGroupView = null;
  this._cartoDBLayerModel = null;

  this._mapModel.on('change:popupsEnabled', this._onPopupsEnabledChanged, this);
};

InfowindowManager.prototype.start = function (cartoDBLayerGroupView) {
  this._cartoDBLayerGroupView = cartoDBLayerGroupView;
  cartoDBLayerGroupView.on('featureClick', this._onFeatureClicked, this);
};

InfowindowManager.prototype.stop = function () {
  this._cartoDBLayerGroupView.off('featureClick', this._onFeatureClicked, this);
  this._unbindLayerModel();

  delete this._cartoDBLayerGroupView;
  delete this._cartoDBLayerModel;
};

InfowindowManager.prototype._onFeatureClicked = function (featureClickEvent) {
  this._unbindLayerModel();

  this._cartoDBLayerModel = featureClickEvent.layer;

  if (!this._cartoDBLayerModel) {
    throw new Error('featureClick event for layer ' + featureClickEvent.layerIndex + ' was captured but layerModel coudn\'t be retrieved');
  }
  if (!this._mapModel.arePopupsEnabled() || !this._cartoDBLayerModel.infowindow.hasTemplate()) {
    return;
  }

  this._bindLayerModel();

  this._updateInfowindowModel();

  this._infowindowModel.setLatLng(featureClickEvent.latlng);
  this._infowindowModel.show();
  this._infowindowModel.setCurrentFeatureId(featureClickEvent.feature.cartodb_id);

  this._tooltipModel.hide();

  this._fetchAttributes(featureClickEvent.feature.cartodb_id);

  var clearFilter = function (infowindowModel) {
    if (!infowindowModel.isVisible()) {
      this._infowindowModel.unsetCurrentFeatureId();
    }
  };

  this._infowindowModel.unbind('change:visibility', clearFilter, this);
  this._infowindowModel.once('change:visibility', clearFilter, this);
};

InfowindowManager.prototype._updateInfowindowModel = function () {
  this._infowindowModel.setInfowindowTemplate(this._cartoDBLayerModel.infowindow);
};

InfowindowManager.prototype._fetchAttributes = function (featureId) {
  this._currentFeatureId = featureId || this._currentFeatureId;
  this._infowindowModel.setLoading();
  var layerIndex = this._cartoDBLayerGroupView.model.getIndexOf(this._cartoDBLayerModel);

  this._cartoDBLayerGroupView.model.fetchAttributes(layerIndex, this._currentFeatureId, function (attributes) {
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
  this._cartoDBLayerModel.on('change:visible', this._onLayerVisibilityChanged, this);
  this._cartoDBLayerModel.infowindow.on('change', this._onInfowindowTemplateChanged, this);
  this._cartoDBLayerModel.infowindow.fields.on('reset', this._onInfowindowTemplateFieldsReset, this);
};

InfowindowManager.prototype._unbindLayerModel = function () {
  if (this._cartoDBLayerModel) {
    this._cartoDBLayerModel.off('change:visible', this._onLayerVisibilityChanged, this);
    this._cartoDBLayerModel.infowindow.off('change', this._onInfowindowTemplateChanged, this);
    this._cartoDBLayerModel.infowindow.fields.off('reset', this._onInfowindowTemplateFieldsReset, this);
  }
};

InfowindowManager.prototype._onInfowindowTemplateChanged = function () {
  this._updateInfowindowModel();
};

InfowindowManager.prototype._onInfowindowTemplateFieldsReset = function () {
  if (this._cartoDBLayerModel.infowindow.hasFields()) {
    this._updateInfowindowModel();
    this._vis.reload({
      success: function () {
        this._fetchAttributes();
      }.bind(this)
    });
  } else {
    this._hideInfowindow();
  }
};

InfowindowManager.prototype._onLayerVisibilityChanged = function () {
  this._hideInfowindow();
};

InfowindowManager.prototype._onPopupsEnabledChanged = function () {
  if (this._mapModel.arePopupsDisabled()) {
    this._hideInfowindow();
  }
};

InfowindowManager.prototype._hideInfowindow = function () {
  this._infowindowModel && this._infowindowModel.hide();
};

module.exports = InfowindowManager;
