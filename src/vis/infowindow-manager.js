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

    this._updateInfowindowModel(layerModel.infowindow);
    this._fetchAttributes(layerView, layerModel, data.cartodb_id, latlng);
  }, this);
};

InfowindowManager.prototype._updateInfowindowModel = function (infowindowTemplate) {
  this._infowindowModel.setInfowindowTemplate(infowindowTemplate);
};

InfowindowManager.prototype._fetchAttributes = function (layerView, layerModel, featureId, latlng) {
  // TODO: If the infowindow is currently showing the data for featureId, we should
  // only update the latlng so that the infowindow is moved and no request is made
  // if (featureId === this._currentFeatureId && latlng) {
  //   this._infowindowModel.set({
  //     latlng: latlng
  //   });
  //   return;
  // }

  this._currentFeatureId = featureId || this._currentFeatureId;
  this._currentLatLng = latlng || this._currentLatLng;
  this._infowindowModel.set({
    latlng: this._currentLatLng,
    visibility: true
  });
  this._infowindowModel.updateContent();

  var layerIndex = layerView.model.getIndexOf(layerModel);
  layerView.model.fetchAttributes(layerIndex, this._currentFeatureId, function (attributes) {
    if (attributes) {
      this._infowindowModel.updateContent(attributes);
    } else {
      console.log("Couldn't fetch attributes for layer #" + layerIndex + ' and feature ' + this._currentFeatureId);
    }
  }.bind(this));

  if (layerView.tooltipView) {
    layerView.tooltipView.setFilter(function (feature) {
      return feature.cartodb_id !== this._currentFeatureId;
    }.bind(this)).hide();
  }
};

InfowindowManager.prototype._bindInfowindowModel = function (layerView, layerModel) {
  layerModel.infowindow.bind('change', function (infowindowTemplate) {
    var needsNewAttributes = false;
    if (this._infowindowModel.hasInfowindowTemplate(infowindowTemplate)) {
      this._updateInfowindowModel(infowindowTemplate);
      if (infowindowTemplate.hasChanged('fields') && this._infowindowModel.get('visibility') === true) {
        needsNewAttributes = true;
      }
    }

    if (infowindowTemplate.hasChanged('fields')) {
      var options = {};
      if (needsNewAttributes) {
        options.success = function () {
          this._fetchAttributes(layerView, layerModel);
        }.bind(this);
      }
      this._map.reload(options);
    }
  }, this);
};

module.exports = InfowindowManager;
