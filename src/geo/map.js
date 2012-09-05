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

// Good old fashioned tile layer
cdb.geo.TileLayer = cdb.geo.MapLayer.extend({
  getTileLayer: function() {
  }
});

/**
 * this layer allows to put a plain color or image as layer (instead of tiles)
 */
cdb.geo.PlainLayer = cdb.geo.MapLayer.extend({
  defaults: {
    type: 'Plain',
    color: '#FFFFFF'
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

cdb.geo.Layers = Backbone.Collection.extend({

  model: cdb.geo.MapLayer,

  clone: function() {
    var layers = new cdb.geo.Layers();
    this.each(function(layer) {
      if(layer.clone) {
        layers.add(layer.clone());
      } else {
        layers.add(_.clone(layer.attributes));
      }
    });
    return layers;
  }
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
    this.layers = new cdb.geo.Layers();
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

  clone: function() {
    var m = new cdb.geo.Map(_.clone(this.attributes));
    // clone lists
    m.set({
      center: _.clone(this.attributes.center),
      bounding_box_sw: _.clone(this.attributes.bounding_box_sw),
      bounding_box_ne: _.clone(this.attributes.bounding_box_ne)
    });
    // layers
    m.layers = this.layers.clone();
    return m;

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
    _.defauls(this.options, options);

  },

  getLayerAt: function(i) {
    return this.layers.at(i);
  },

  getLayerByCid: function(cid) {
    return this.layers.getByCid(cid);
  },

  addLayer: function(layer, opts) {
    this.layers.add(layer, opts);
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
  },

  // remove current base layer and set the specified
  // the base layer is not deleted, it is only removed 
  // from the layer list
  // return the old one
  setBaseLayer: function(layer) {
    var old = this.layers.at(0);
    this.layers.remove(old);
    this.layers.add(layer, { at: 0 });
    return old;
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

    // this var stores views information for each model
    this.layers = {};
  },

  render: function() {
    return this;
  },

  /**
   * add a infowindow to the map
   */
  addInfowindow: function(infoWindowView) {
    this.$el.append(infoWindowView.render().el);
    this.addView(infoWindowView);
  },

  showBounds: function(bounds) {
    throw "to be implemented";
  },

  /**
  * set model property but unbind changes first in order to not create an infinite loop
  */
  _setModelProperty: function(prop) {
    this._unbindModel();
    this.map.set(prop);
    this._bindModel();
  },

  /** bind model properties */
  _bindModel: function() {
    this.map.bind('change:zoom',   this._setZoom, this);
    this.map.bind('change:center', this._setCenter, this);
  },

  /** unbind model properties */
  _unbindModel: function() {
    this.map.unbind('change:zoom',   this._setZoom, this);
    this.map.unbind('change:center', this._setCenter, this);
  },

  _addLayers: function() {
    var self = this;
    this.map.layers.each(function(lyr) {
      self._addLayer(lyr);
    });
  },

  _removeLayer: function(layer) {
    this.layers[layer.cid].remove();
    delete this.layers[layer.cid];
  },

  getLayerByCid: function(cid) {
    var l = this.layers[cid];
    if(!l) {
      cdb.log.error("layer with cid " + cid + " can't be get");
    }
    return l;
  },

  _setZoom: function(model, z) {
    throw "to be implemented";
  },

  _setCenter: function(model, center) {
    throw "to be implemented";
  },

  _addLayer: function(layer, layers, opts) {
    throw "to be implemented";
  }


});
