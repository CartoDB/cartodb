/* global L */
var _ = require('underscore');
var C = require('../../constants');
var LeafletLayerView = require('./leaflet-layer-view');
var CartoDBLayerGroupViewBase = require('../cartodb-layer-group-view-base');
var zera = require('@carto/zera');
var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

var LeafletCartoDBLayerGroupView = function (layerModel, opts) {
  LeafletLayerView.apply(this, arguments);
  CartoDBLayerGroupViewBase.apply(this, arguments);

  this.leafletLayer.on('load', function () {
    this.trigger('load');
  }.bind(this));

  this.leafletLayer.on('loading', function () {
    this.trigger('loading');
  }.bind(this));

  this.leafletLayer.on('tileerror', function (layer) {
    this.model.addError({ type: C.WINDSHAFT_ERRORS.TILE });
  }.bind(this));
};

LeafletCartoDBLayerGroupView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  CartoDBLayerGroupViewBase.prototype,
  {
    interactionClass: zera.Interactive,

    _createLeafletLayer: function () {
      var tileLayer = new L.TileLayer(null, {
        opacity: 0.99,
        maxZoom: 30
      });
      tileLayer._setUrl = function (url, noDraw) {
        return L.TileLayer.prototype.setUrl.call(this, url, noDraw);
      };
      return tileLayer;
    },

    _reload: function () {
      var tileURLTemplate = this.model.getTileURLTemplate();
      var subdomains = this.model.getSubdomains();

      if (!tileURLTemplate) {
        tileURLTemplate = EMPTY_GIF;
      }

      if (subdomains) {
        L.Util.setOptions(this.leafletLayer, { subdomains: subdomains });
      }

      this.leafletLayer._setUrl(tileURLTemplate);

      this._reloadInteraction();
    },

    _manageOffEvents: function (nativeMap, zeraEvent) {
      this._onFeatureOut(zeraEvent.layer);
    },

    _manageOnEvents: function (nativeMap, zeraEvent) {
      var containerPoint = nativeMap.layerPointToContainerPoint(zeraEvent.layerPoint);

      if (!containerPoint || isNaN(containerPoint.x) || isNaN(containerPoint.y)) {
        return false;
      }

      var latlng = nativeMap.containerPointToLatLng(containerPoint);

      var eventType = zeraEvent.e.type.toLowerCase();

      switch (eventType) {
        case 'mousemove':
          this._onFeatureOver(latlng, containerPoint, zeraEvent.data, zeraEvent.layer);
          break;
        case 'click':
          this._onFeatureClicked(latlng, containerPoint, zeraEvent.data, zeraEvent.layer);
          break;
      }
    },

    _onFeatureClicked: function (latlon, containerPoint, data, layer) {
      var layerModel = this.model.getLayerInLayerGroupAt(layer);
      if (layerModel) {
        this.trigger('featureClick', {
          layer: layerModel,
          layerIndex: layer,
          latlng: [latlon.lat, latlon.lng],
          position: containerPoint,
          feature: data
        });
      }
    },

    _onFeatureOver: function (latlon, containerPoint, data, layer) {
      var layerModel = this.model.getLayerInLayerGroupAt(layer);
      if (layerModel) {
        this.trigger('featureOver', {
          layer: layerModel,
          layerIndex: layer,
          latlng: [latlon.lat, latlon.lng],
          position: containerPoint,
          feature: data
        });
      }
    },

    _onFeatureOut: function (layerIndex) {
      var layerModel = this.model.getLayerInLayerGroupAt(layerIndex);
      if (layerModel) {
        this.trigger('featureOut', {
          layer: layerModel,
          layerIndex: layerIndex
        });
      }
    }
  }
);

LeafletCartoDBLayerGroupView.prototype.constructor = LeafletLayerView;

module.exports = LeafletCartoDBLayerGroupView;
