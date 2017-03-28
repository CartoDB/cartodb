var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view');
var CartoDBLayerGroupViewBase = require('../cartodb-layer-group-view-base');
var wax = require('wax.cartodb.js');

var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

var findContainerPoint = function (map, o) {
    var curleft = 0;
    var curtop = 0;
    var obj = map.getContainer();

    var x, y;
    if (o.e.changedTouches && o.e.changedTouches.length > 0) {
      x = o.e.changedTouches[0].clientX + window.scrollX;
      y = o.e.changedTouches[0].clientY + window.scrollY;
    } else {
      x = o.e.clientX;
      y = o.e.clientY;
    }

    // If the map is fixed at the top of the window, we can't use offsetParent
    // cause there might be some scrolling that we need to take into account.
    if (obj.offsetParent && obj.offsetTop > 0) {
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      var point = new L.Point(
        x - curleft, y - curtop);
    } else {
      var rect = obj.getBoundingClientRect();
      var scrollX = (window.scrollX || window.pageXOffset);
      var scrollY = (window.scrollY || window.pageYOffset);
      var point = new L.Point(
        (o.e.clientX ? o.e.clientX : x) - rect.left - obj.clientLeft - scrollX,
        (o.e.clientY ? o.e.clientY : y) - rect.top - obj.clientTop - scrollY);
    }

    return point;
};

var LeafletCartoDBLayerGroupView = function (layerModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, arguments);
  CartoDBLayerGroupViewBase.call(this, layerModel, leafletMap);

  this.leafletLayer.on('load', function (e) {
    self.trigger('load');
  });

  this.leafletLayer.on('loading', function (e) {
    self.trigger('loading');
  });
};

LeafletCartoDBLayerGroupView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  CartoDBLayerGroupViewBase.prototype,
  {
    interactionClass: wax.leaf.interaction,

    _createLeafletLayer: function (layerModel) {
      return new L.TileLayer(null, {
        opacity: 0.99,
        maxZoom: 30
      });
    },

    _reload: function () {
      var tileURLTemplate = this.model.getTileURLTemplate();
      var subdomains = this.model.getSubdomains();

      if (!tileURLTemplate) {
        tileURLTemplate = EMPTY_GIF;
      }

      if (subdomains) {
        L.Util.setOptions(this.leafletLayer, {subdomains:subdomains});
      }

      this.leafletLayer.setUrl(tileURLTemplate);

      this._reloadInteraction();
    },

    _manageOffEvents: function (nativeMap, waxEvent) {
      this._onFeatureOut(waxEvent.layer);
    },

    _manageOnEvents: function (nativeMap, waxEvent) {
      var containerPoint = findContainerPoint(nativeMap, waxEvent);

      if (!containerPoint || isNaN(containerPoint.x) || isNaN(containerPoint.y)) {
        return false;
      }

      var latlng = nativeMap.containerPointToLatLng(containerPoint);

      var eventType = waxEvent.e.type.toLowerCase();

      switch (eventType) {
        case 'mousemove':
          this._onFeatureOver(latlng, containerPoint, waxEvent.data, waxEvent.layer);
          break;
        case 'click':
          this._onFeatureClicked(latlng, containerPoint, waxEvent.data, waxEvent.layer);
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
    },
  }
);

LeafletCartoDBLayerGroupView.prototype.constructor = LeafletLayerView;

module.exports = LeafletCartoDBLayerGroupView;