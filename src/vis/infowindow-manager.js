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
  this._mapView.addInfowindow(this._infowindowView);
};

InfowindowManager.prototype._bindFeatureClickEvent = function (layerView) {
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
    this._infowindowView.model.set(layerModel.infowindow.toJSON());
    this._infowindowView.model.set('sourceLayerModelCID', layerModel.cid);
    this._infowindowView.model.set('cartodb_id', cartoDBId);
    layerView.model.fetchAttributes(layerIndex, cartoDBId, function (attributes) {
      if (attributes) {
        this._infowindowView.model.updateContent(attributes);
      } else {
        this._infowindowView.setError();
      }
    }.bind(this));

    // Show infowindow with loading state
    this._infowindowView
      .setLatLng(latlng)
      .setLoading()
      .showInfowindow();

    if (layerView.tooltipView) {
      layerView.tooltipView.setFilter(function (feature) {
        return feature.cartodb_id !== cartoDBId;
      }).hide();
    }
  }, this);
};

InfowindowManager.prototype._bindInfowindowModel = function (layerView, layerModel) {
  layerModel.infowindow.bind('change', function () {
    var infowindowView = this._infowindowView;
    // TODO: Check if the current infowindow is the one that changed
    if (infowindowView.model.get('sourceLayerModelCID') === layerModel.cid) {
      infowindowView.model.set(layerModel.infowindow.toJSON());

      // If the infowindow is visible and fields have changed
      if (infowindowView.model.hasChanged('fields')) {

        // If visible -> Fetch attributes as soon as new instance is created
        if (infowindowView.model.get('visibility') === true) {
          this._vis._windshaftMap.once('instanceCreated', function () {
            var cartoDBId = infowindowView.model.get('cartodb_id');
            var layerIndex = layerView.model.layers.indexOf(layerModel);
            infowindowView.setLoading();
            layerView.model.fetchAttributes(layerIndex, cartoDBId, function (attributes) {
              if (attributes) {
                infowindowView.model.updateContent(attributes);
              } else {
                infowindowView.setError();
              }
            });
          });
        }
      }
    }

    this._vis.map.reload();
  }, this);
};

module.exports = InfowindowManager;
