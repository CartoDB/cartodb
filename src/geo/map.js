/**
* classes to manage maps
*/


/**
* map layer, could be tiled or whatever
*/
cdb.geo.MapLayer = Backbone.Model.extend({

  TILED: 'tiled',

  defaults: {
    visible: true
  }
});

cdb.geo.TileLayer = cdb.geo.MapLayer.extend({
  initialize: function() {
    this.set({'type': "Tile" });
  },
  getTileLayer: function () {
    return new L.TileLayer(this.get('urlTemplate'));
  }
});

cdb.geo.CartoDBLayer = cdb.geo.MapLayer.extend({
  defaults: {
    query:          "SELECT * FROM {{table_name}}",
    opacity:        0.99,
    auto_bound:     false,
    debug:          false,
    visible:        true,
    tiler_domain:   "cartodb.com",
    tiler_port:     "80",
    tiler_protocol: "http",
    sql_domain:     "cartodb.com",
    sql_port:       "80",
    sql_protocol:   "http",
    extra_params:   {},
    cdn_url:        null
  },

  initialize: function() {
    this.set({'type': 'CartoDB' });
  },

  generateUrl: function(type){

    // Check if we are using a CDN and in that case, return the provided URL
    if ( this.get("cdn_url") ) {
      return this.get("cdn_url");
    }

    var // let's build the URL
    username     = this.get("user_name"),
    domain       = this.get("sql_domain"),
    port         = this.get("sql_port"),
    protocol     = this.get("sql_protocol");

    if (type != "sql") {
      protocol = this.get("tiler_protocol");
    }

    return protocol + "://" + ( username ? username + "." : "" ) + domain + ( port != "" ? (":" + port) : "" );

  },

  getTileLayer: function() {

  // TODO: Add the version with interactivity

    var // Then add the cartodb tiles
    style     = this.get("tile_style"),
    tableName = this.get("table_name"),
    query     = this.get("query");

    tileStyle  = (style) ? encodeURIComponent(style.replace(/\{\{table_name\}\}/g, tableName )) : '';
    query      = encodeURIComponent(query.replace(/\{\{table_name\}\}/g, tableName ));

    var cartodb_url = this.generateUrl("tiler") + '/tiles/' + tableName + '/{z}/{x}/{y}.png?sql=' + query +'&style=' + tileStyle;

    _.each(this.attributes.extra_params, function(value, name) {
      cartodb_url += "&" + name + "=" + value;
    });

    return new L.TileLayer(cartodb_url, { attribution:'CartoDB', opacity: this.get("opacity") });
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
    zoom: 9
  },

  initialize: function() {
    this.layers = new cdb.geo.MapLayers();
  },

  setZoom: function(z) {
    this.set({zoom:  z});
  },

  getZoom: function() {
    return this.get('zoom');
  },

  setCenter: function(latlng) {
    this.set({center: latlng});
  },

  /**
  * add a layer to the map
  */
  addLayer: function(layer) {
    this.layers.add(layer);
  }

});


/**
* base view for all impl
*/
cdb.geo.MapView = cdb.core.View.extend({

  initialize: function() {
    if(this.options.map === undefined) {
      throw new Exception("you should specify a map model");
    }
    this.map = this.options.map;
    this.add_related_model(this.map);
  }

});

/**
* leatlef impl
*/
cdb.geo.LeafletMapView = cdb.geo.MapView.extend({

  initialize: function() {

    _.bindAll(this, '_addLayer', '_setZoom', '_setCenter');

    cdb.geo.MapView.prototype.initialize.call(this);

    var self = this;

    this.map_leaflet = new L.Map(this.el, {
      zoomControl: false
    });

    this.map.layers.bind('add', this._addLayer);

    this._bindModel();

    //set options
    this._setCenter(this.map, this.map.get('center'));
    this._setZoom(this.map, this.map.get('zoom'));

    this.map_leaflet.on('zoomend', function() {
      self._setModelProperty({zoom: self.map_leaflet.getZoom()});
    }, this);

    this.map_leaflet.on('drag', function () {
      var c = self.map_leaflet.getCenter();
      self._setModelProperty({center: [c.lat, c.lng]});
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

  _addLayer: function(layer) {
    var lyr;

    if ( layer.get('type') == "Tile" ) {
      lyr = layer.getTileLayer();
    }

    if ( layer.get('type') == 'CartoDB') {
      lyr = layer.getTileLayer();
    }

    if (lyr) {
      this.map_leaflet.addLayer(lyr);
    } else {
      cdb.log.error("layer type not supported");
    }
}
});
