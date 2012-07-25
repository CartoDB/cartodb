/**
 * leaflet implementation of a map
 */
(function() {

/**
 * base layer for all leaflet layers
 */
var LeafLetLayerView = function(layerModel, leafletLayer, leafletMap) {
  this.leafletLayer = leafletLayer;
  this.leafletMap = leafletMap;
  this.model = layerModel;
  this.model.bind('change', this._update, this);
};

_.extend(LeafLetLayerView.prototype, Backbone.Events);
_.extend(LeafLetLayerView.prototype, {

  /**
   * remove layer from the map and unbind events
   */
  remove: function() {
    this.leafletMap.removeLayer(this.leafletLayer);
    this.model.unbind(null, null, this);
    this.unbind();
  }

});


var LeafLetTiledLayerView = function(layerModel, leafletMap) {
  var leafletLayer = new L.TileLayer(layerModel.get('urlTemplate'));
  LeafLetLayerView.call(this, layerModel, leafletLayer, leafletMap);
};

_.extend(LeafLetTiledLayerView.prototype, LeafLetLayerView.prototype, {
  _update: function() {
    _.defaults(this.leafletLayer.options, _.clone(this.model.attributes));
    this.leafletLayer.setUrl(this.model.get('urlTemplate'));
  }
});

cdb.geo.LeafLetTiledLayerView = LeafLetTiledLayerView;

/**
 * leatlet cartodb layer
 */

var LeafLetLayerCartoDBView = function(layerModel, leafletMap) {
  var self = this;

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

  var opts = _.clone(layerModel.attributes);

  opts.map =  leafletMap;

  var // preserve the user's callbacks
  _featureOver  = opts.featureOver,
  _featureOut   = opts.featureOut,
  _featureClick = opts.featureClick;

  opts.featureOver  = function() {
    _featureOver  && _featureOver.apply(this, arguments);
    self.featureOver  && self.featureOver.apply(this, arguments);
  };

  opts.featureOut  = function() {
    _featureOut  && _featureOut.apply(this, arguments);
    self.featureOut  && self.featureOut.apply(this, arguments);
  };

  opts.featureClick  = function() {
    _featureClick  && _featureClick.apply(this, arguments);
    self.featureClick  && self.featureClick.apply(opts, arguments);
  };

  leafletLayer = new L.CartoDBLayer(opts);
  LeafLetLayerView.call(this, layerModel, leafletLayer, leafletMap);
};


_.extend(LeafLetLayerCartoDBView.prototype, LeafLetLayerView.prototype, {

  _update: function() {
    this.leafletLayer.setOptions(_.clone(this.model.attributes));
  },

  featureOver: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureOver', e, [latlon.lat, latlon.lng], pixelPos, data);
  },

  featureOut: function(e) {
    this.trigger('featureOut', e);
  },

  featureClick: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureClick', e, [latlon.lat, latlon.lng], pixelPos, data);
  }

});

cdb.geo.LeafLetLayerCartoDBView = LeafLetLayerCartoDBView;

/**
 * leatlef impl
 */
cdb.geo.LeafletMapView = cdb.geo.MapView.extend({

  initialize: function() {

    _.bindAll(this, '_addLayer', '_removeLayer', '_setZoom', '_setCenter', '_setView');

    cdb.geo.MapView.prototype.initialize.call(this);

    var self = this;

    var center = this.map.get('center');

    this.map_leaflet = new L.Map(this.el, {
      zoomControl: false,
      center: new L.LatLng(center[0], center[1]),
      zoom: this.map.get('zoom')
    });

    // this var stores views information for each model
    this.layers = {};

    this.map.bind('set_view', this._setView, this);
    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('remove', this._removeLayer, this);
    this.map.layers.bind('reset', this._addLayers, this);

    this._bindModel();

    this._addLayers();

    this.map_leaflet.on('layeradd', function(lyr) {
      this.trigger('layeradd', lyr, self);
    }, this);

    this.map_leaflet.on('zoomend', function() {
      self._setModelProperty({
        zoom: self.map_leaflet.getZoom()
      });
    }, this);

    this.map_leaflet.on('move', function() {
      var c = self.map_leaflet.getCenter();
      self._setModelProperty({ center: [c.lat, c.lng] });
    });

    this.map_leaflet.on('drag', function() {
      var c = self.map_leaflet.getCenter();
      self._setModelProperty({
        center: [c.lat, c.lng]
      });
    }, this);

  },

  /** bind model properties */
  _bindModel: function() {
    this.map.bind('change:zoom', this._setZoom, this);
    this.map.bind('change:center', this._setCenter, this);
  },

  /** unbind model properties */
  _unbindModel: function() {
    this.map.unbind('change:zoom', this._setZoom, this);
    this.map.unbind('change:center', this._setCenter, this);
  },

  /**
   * set model property but unbind changes first in order to not create an infinite loop
   */
  _setModelProperty: function(prop) {
    this._unbindModel();
    this.map.set(prop);
    this._bindModel();
  },

  _setZoom: function(model, z) {
    this.map_leaflet.setZoom(z);
  },

  _setCenter: function(model, center) {
    this.map_leaflet.panTo(new L.LatLng(center[0], center[1]));
  },

  /**
   * Adds interactivity to a layer
   *
   * @params {String} tileJSON
   * @params {String} featureOver
   * @return {String} featureOut
   */
  addInteraction: function(tileJSON, featureOver, featureOut) {

    return wax.leaf.interaction().map(this.map_leaflet).tilejson(tileJSON).on('on', featureOver).on('off', featureOut);

  },

  getLayerByCid: function(cid) {
    var l = this.layers[cid];
    if(!l) {
      cdb.log.error("layer with cid " + cid + " can't be get");
    }
    return l;
  },

  _removeLayer: function(layer) {
    //this.map_leaflet.removeLayer(layer.lyr);
    this.layers[layer.cid].remove();
    delete this.layers[layer.cid];
  },

  _setView: function() {
    this.map_leaflet.setView(this.map.get("center"), this.map.get("zoom"));
  },


  _addLayers: function() {
    var self = this;
    this.map.layers.each(function(lyr) {
      self._addLayer(lyr);
    });
  }, 

  _addLayer: function(layer) {
    var lyr, layer_view;

    if (layer.get('type') == "Tiled") {
      layer_view = new cdb.geo.LeafLetTiledLayerView(layer, this.map_leaflet);
    } else if (layer.get('type') == 'CartoDB') {
      layer_view = new cdb.geo.LeafLetLayerCartoDBView(layer, this.map_leaflet);
    } else {
      cdb.log.error("MAP: " + layer.get('type') + " can't be created");
    }

    this.layers[layer.cid] = layer_view;

    if (layer_view) {
      var isBaseLayer = this.layers.length === 1;
      this.map_leaflet.addLayer(layer_view.leafletLayer, isBaseLayer);
    } else {
      cdb.log.error("layer type not supported");
    }
  },

  latLonToPixel: function(latlon) {
    var point = this.map_leaflet.latLngToLayerPoint(new L.LatLng(latlon[0], latlon[1]));
    return this.map_leaflet.layerPointToContainerPoint(point);
  }

});

})();
