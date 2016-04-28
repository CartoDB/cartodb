var _ = require('underscore');
var Overlay = require('./vis/overlay');

/**
 * Manages the infowindows for a map. It listens to changes on the collection
 * of layers and binds a new infowindow view/model to CartoDB.js whenever the
 * collection of layers changes
 */
var InfowindowManager = function (vis) {
  this._vis = vis;
};

InfowindowManager.prototype.manage = function (mapView, map) {
  this._mapView = mapView;
  this._map = map;

  this._map.layers.bind('reset', function (layers) {
    layers.each(this._addInfowindowForLayer, this);
  }, this);
  this._map.layers.bind('add', this._addInfowindowForLayer, this);
};

InfowindowManager.prototype._addInfowindowForLayer = function (layerModel) {
  if (layerModel.infowindow) {
    var layerView = this._mapView.getLayerViewByLayerCid(layerModel.cid);

    if (!this._infowindowView) {
      this._addInfowindowOverlay(layerView, layerModel);
      this._bindFeatureClickEvent(layerView);
    }
    this._bindInfowindowModel(layerView, layerModel);

    layerView.bind('mouseover', function () {
      this._mapView.setCursor('pointer');
    }, this);

    layerView.bind('mouseout', function (m, layer) {
      this._mapView.setCursor('auto');
    }, this);
  }
};

InfowindowManager.prototype._addInfowindowOverlay = function (layerView, layerModel) {
  this._infowindowView = Overlay.create('infowindow', this._vis, layerModel.infowindow.toJSON());
  this._infowindowModel = this._infowindowView.model;
  this._mapView.addInfowindow(this._infowindowView);
};

InfowindowManager.prototype._bindFeatureClickEvent = function (layerView) {
  layerView.bind('featureClick', function (e, latlng, pos, data, layerIndex) {
    var layerModel = layerView.model.getLayerAt(layerIndex);
    if (!layerModel) {
      throw new Error('featureClick event for layer ' + layerIndex + ' was captured but layerModel coudn\'t be retrieved');
    }

    if (!layerModel.getInfowindowData()) {
      return;
    }

    this._updateInfowindowModelAndFetchAttributes(layerView, layerModel, data.cartodb_id, latlng);
  }, this);
};

InfowindowManager.prototype._updateInfowindowModelAndFetchAttributes = function (layerView, layerModel, featureId, latlng) {
  this._currentFeatureId = featureId || this._currentFeatureId;
  this._infowindowModel.setInfowindowTemplate(layerModel.infowindow);
  this._infowindowModel.set({
    latlng: latlng,
    status: 'loading',
    visibility: true
  });
  var layerIndex = layerView.model.getIndexOf(layerModel);
  layerView.model.fetchAttributes(layerIndex, this._currentFeatureId, function (attributes) {
    if (attributes) {
      this._infowindowModel.updateContent(attributes);
      this._infowindowModel.set('status', 'ready');
    } else {
      this._infowindowModel.set('status', 'error');
    }
  }.bind(this));

  if (layerView.tooltipView) {
    layerView.tooltipView.setFilter(function (feature) {
      return feature.cartodb_id !== this._currentFeatureId;
    }).hide();
  }
};

InfowindowManager.prototype._bindInfowindowModel = function (layerView, layerModel) {
  layerModel.infowindow.bind('change', function () {
    if (this._infowindowModel.hasInfowindowTemplate(layerModel.infowindow)) {
      // If the infowindow is visible and fields have changed
      if (layerModel.hasChanged('fields') && this._infowindowModel.get('visibility') === true) {
        this._vis._windshaftMap.once('instanceCreated', function () {
          this._updateInfowindowModelAndFetchAttributes(layerView, layerModel);
        }, this);
      }
    }
    this._map.reload();
  }, this);
};

module.exports = InfowindowManager;
