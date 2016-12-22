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
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.infowindowModel) throw new Error('infowindowModel is required');

  this._vis = deps.visModel;
  this._mapModel = deps.mapModel;
  this._mapView = deps.mapView;
  this._infowindowModel = deps.infowindowModel;
  this._showEmptyFields = !!options.showEmptyFields;
  this._featureClickBound = {};

  this._mapModel.layers.bind('reset', function (layers) {
    layers.each(this._addInfowindowForLayer, this);
  }, this);
  this._mapModel.layers.bind('add', this._addInfowindowForLayer, this);
  this._mapModel.layers.each(this._addInfowindowForLayer, this);
  this._mapModel.on('change:popupsEnabled', this._onPopupsEnabledChanged, this);
};

InfowindowManager.prototype._addInfowindowForLayer = function (layerModel) {
  if (layerModel.infowindow) {
    var layerView = this._mapView.getLayerViewByLayerCid(layerModel.cid);
    if (!this._featureClickBound[layerView.cid]) {
      this._bindFeatureClickEvent(layerView);
      this._featureClickBound[layerView.cid] = true;
    }
    this._bindInfowindowModel(layerView, layerModel);
  }
};

InfowindowManager.prototype._bindFeatureClickEvent = function (layerView) {
  layerView.bind('featureClick', function (e, latlng, pos, data, layerIndex) {
    var layerModel = layerView.model.getLayerAt(layerIndex);
    if (!layerModel) {
      throw new Error('featureClick event for layer ' + layerIndex + ' was captured but layerModel coudn\'t be retrieved');
    }
    if (!this._mapModel.arePopupsEnabled() || !layerModel.infowindow.hasTemplate()) {
      return;
    }

    this._updateInfowindowModel(layerModel.infowindow);

    this._infowindowModel.set({
      latlng: latlng,
      visibility: true
    });

    this._fetchAttributes(layerView, layerModel, data.cartodb_id, latlng);

    if (layerView.tooltipView) {
      layerView.tooltipView.setFilter(function (feature) {
        return feature.cartodb_id !== data.cartodb_id;
      }).hide();
    }

    var clearFilter = function (infowindowModel) {
      if (!infowindowModel.get('visibility')) {
        layerView.tooltipView && layerView.tooltipView.setFilter(null);
      }
    };

    this._infowindowModel.unbind('change:visibility', clearFilter);
    this._infowindowModel.once('change:visibility', clearFilter);
  }, this);
};

InfowindowManager.prototype._updateInfowindowModel = function (infowindowTemplate) {
  this._infowindowModel.setInfowindowTemplate(infowindowTemplate);
};

InfowindowManager.prototype._fetchAttributes = function (layerView, layerModel, featureId) {
  this._currentFeatureId = featureId || this._currentFeatureId;
  this._infowindowModel.setLoading();

  var layerIndex = layerView.model.getIndexOf(layerModel);
  layerView.model.fetchAttributes(layerIndex, this._currentFeatureId, function (attributes) {
    if (attributes) {
      this._infowindowModel.updateContent(attributes, {
        showEmptyFields: this._showEmptyFields
      });
    } else {
      this._infowindowModel.setError();
    }
  }.bind(this));
};

InfowindowManager.prototype._bindInfowindowModel = function (layerView, layerModel) {
  layerModel.infowindow.bind('change', function () {
    this._updateInfowindowModel(layerModel.infowindow);
  }, this);

  layerModel.infowindow.fields.bind('reset', function () {
    if (layerModel.infowindow.hasFields()) {
      this._updateInfowindowModel(layerModel.infowindow);
      if (this._infowindowModel.get('visibility')) {
        this._reloadVisAndFetchAttributes(layerView, layerModel);
      } else {
        this._reloadVis();
      }
    } else {
      if (this._isLayerInfowindowActiveAndVisible(layerModel)) {
        this._hideInfowindow();
      }
    }
  }, this);

  layerModel.bind('change:visible', function () {
    if (this._isLayerInfowindowActiveAndVisible(layerModel)) {
      this._hideInfowindow();
    }
  }, this);
};

InfowindowManager.prototype._isLayerInfowindowActiveAndVisible = function (layerModel) {
  return this._infowindowModel.hasInfowindowTemplate(layerModel.infowindow) &&
    this._infowindowModel.get('visibility');
};

InfowindowManager.prototype._reloadVis = function (options) {
  options = options || {};
  this._vis.reload(options);
};

InfowindowManager.prototype._reloadVisAndFetchAttributes = function (layerView, layerModel) {
  this._reloadVis({
    success: function () {
      this._fetchAttributes(layerView, layerModel);
    }.bind(this)
  });
};

InfowindowManager.prototype._onPopupsEnabledChanged = function () {
  if (this._mapModel.arePopupsDisabled()) {
    this._hideInfowindow();
  }
};

InfowindowManager.prototype._hideInfowindow = function () {
  this._infowindowModel && this._infowindowModel.set('visibility', false);
};

module.exports = InfowindowManager;
