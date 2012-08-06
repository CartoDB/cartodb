/**
* Classes to manage maps
*/

/**
* Map layer, could be tiled or whatever
*/
cdb.geo.MapLayer = Backbone.Model.extend({

  defaults: {
    visible: true,
    type: 'Tiled'
  }

});

/**
* list of layers
*/
cdb.geo.Layers = Backbone.Collection.extend({
  model: cdb.geo.MapLayer
});

// Good old fashioned tile layer
cdb.geo.TileLayer = cdb.geo.MapLayer.extend({
  getTileLayer: function() {
  }
});

// CartoDB layer
cdb.geo.CartoDBLayer = cdb.geo.MapLayer.extend({
  defaults: {
    type: 'CartoDB',
    query: null,
    opacity: 0.99,
    auto_bound: false,
    interactivity: null,
    debug: false,
    visible: true,
    tiler_domain: "cartodb.com",
    tiler_port: "80",
    tiler_protocol: "http",
    sql_domain: "cartodb.com",
    sql_port: "80",
    sql_protocol: "http",
    extra_params: {},
    cdn_url: null
  }
});

cdb.geo.MapLayers = Backbone.Collection.extend({
  model: cdb.geo.MapLayer
});

/**
* map model itself
*/
cdb.geo.Map = Backbone.Model.extend({

  defaults: {
    center: [0, 0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 20,
    bounding_box_sw: [0, 0],
    bounding_box_ne: [0, 0],
    provider: 'leaflet'
  },

  initialize: function() {
    this.layers = new cdb.geo.MapLayers();
  },

  setView: function(latlng, zoom) {
    this.set({
      center: latlng,
      zoom: zoom
    }, {
      silent: true
    });
    this.trigger("set_view");
  },

  setZoom: function(z) {
    this.set({
      zoom: z
    });
  },

  getZoom: function() {
    return this.get('zoom');
  },

  setCenter: function(latlng) {
    this.set({
      center: latlng
    });
  },

  /**
  * Change multiple options at the same time
  * @params {Object} New options object
  */
  setOptions: function(options) {
    if (typeof options != "object" || options.length) {
      if (this.options.debug) {
        throw (options + ' options has to be an object');
      } else {
        return;
      }
    }

    // Set options
    L.Util.setOptions(this, options);

  },

  getLayerAt: function(i) {
    return this.layers.at(i);
  },
  getLayerByCid: function(cid) {
    return this.layers.getByCid(cid);
  },
  addLayer: function(layer) {
    this.layers.add(layer);

    return layer.cid;
  },

  removeLayer: function(layer) {
    this.layers.remove(layer);
  },

  removeLayerByCid: function(cid) {
    var layer = this.layers.getByCid(cid);

    if (layer) this.removeLayer(layer);
    else cdb.log.error("There's no layer with cid = " + cid + ".");
  },

  removeLayerAt: function(i) {
    var layer = this.layers.at(i);

    if (layer) this.removeLayer(layer);
    else cdb.log.error("There's no layer in that position.");
  },

  clearLayers: function() {
    while (this.layers.length > 0) {
      this.removeLayer(this.layers.at(0));
    }
  },

  // by default the base layer is the layer at index 0
  getBaseLayer: function() {
    return this.layers.at(0);
  }
});


/**
* Base view for all impl
*/
cdb.geo.MapView = cdb.core.View.extend({

  initialize: function() {

    if (this.options.map === undefined) {
      throw new Exception("you should specify a map model");
    }

    this.map = this.options.map;
    this.add_related_model(this.map);
  },

  render: function() {
    return this;
  }

});
