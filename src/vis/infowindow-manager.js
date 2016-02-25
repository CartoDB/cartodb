var _ = require('underscore');
var Overlay = require('./vis/overlay');
var InfowindowModel = require('../geo/ui/infowindow-model');

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
  if (layerModel.getInfowindowData && layerModel.getInfowindowData()) {
    var layerView = this._mapView.getLayerViewByLayerCid(layerModel.cid);

    this._addInfowindowOverlay(layerView, layerModel);
    this._bindFeatureClickEvent(layerView);

    layerView.bind('mouseover', function () {
      this._mapView.setCursor('pointer');
    }, this);

    layerView.bind('mouseout', function (m, layer) {
      this._mapView.setCursor('auto');
    }, this);
  }
};

InfowindowManager.prototype._addInfowindowOverlay = function (layerView, layerModel) {
  var infowindowView = layerView.infowindowView;
  if (!infowindowView) {
    layerView.infowindowView = infowindowView = Overlay.create('infowindow', this._vis, layerModel.getInfowindowData());
    this._mapView.addInfowindow(infowindowView);
  }
};

InfowindowManager.prototype._bindFeatureClickEvent = function (layerView) {
  var infowindowView = layerView.infowindowView;
  layerView.unbind('featureClick');
  layerView.bind('featureClick', function (e, latlng, pos, data, layerIndex) {
    var layerModel = layerView.model;
    if (layerModel.layers) {
      layerModel = layerModel.layers.at(layerIndex);
    }
    if (!layerModel) {
      throw new Error('featureClick event for layer ' + layerIndex + ' was captured but layerModel coudn\'t be retrieved');
    }

    var infowindowFields = layerModel.getInfowindowData();
    if (!infowindowFields) {
      return;
    }
    var cartoDBId = data.cartodb_id;

    layerView.model.fetchAttributes(layerIndex, cartoDBId, function (attributes) {
      // Old viz.json doesn't contain width and maxHeight properties
      // and we have to get the default values if there are not defined.
      var extra = _.defaults(
        {
          offset: infowindowFields.offset,
          width: infowindowFields.width,
          maxHeight: infowindowFields.maxHeight
        },
        InfowindowModel.prototype.defaults
      );

      infowindowView.model.set({
        'fields': infowindowFields.fields,
        'template': infowindowFields.template,
        'template_type': infowindowFields.template_type,
        'alternative_names': infowindowFields.alternative_names,
        'sanitizeTemplate': infowindowFields.sanitizeTemplate,
        'offset': extra.offset,
        'width': extra.width,
        'maxHeight': extra.maxHeight
      });

      if (attributes) {
        infowindowView.model.updateContent(attributes);
        infowindowView.adjustPan();
      } else {
        infowindowView.setError();
      }
    });

    // Show infowindow with loading state
    infowindowView
      .setLatLng(latlng)
      .setLoading()
      .showInfowindow();

    if (layerView.tooltipView) {
      layerView.tooltipView.setFilter(function (feature) {
        return feature.cartodb_id !== cartoDBId;
      }).hide();
    }
  });
};

module.exports = InfowindowManager;
