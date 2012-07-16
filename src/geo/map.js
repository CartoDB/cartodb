/**
* classes to manage maps
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

cdb.geo.Layers = Backbone.Collection.extend({
  model: cdb.geo.MapLayer
});

// Good old fashioned tile layer
cdb.geo.TileLayer = cdb.geo.MapLayer.extend({
  getTileLayer: function () {
    return new L.TileLayer(this.get('urlTemplate'));
  }
});

// CartoDB layer
cdb.geo.CartoDBLayer = cdb.geo.MapLayer.extend({
  defaults: {
    type:           'CartoDB',
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
    _.bindAll(this, 'getTileLayer', '_getInteractiveLayer', '_getStaticTileLayer', '_bindWaxEvents', 'setBounds');

    if (this.get("auto_bound")) {
      this.setBounds();
    }

  },

  _generateURL: function(type){

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

  /**
  * Appends callback to the urls
  *
  * @params {String} Tile url
  * @params {String} Tile data
  * @return {String} Tile url parsed
  */
  _addUrlData: function (url, data) {
    url += this._parseUri(url).query ? '&' : '?';
    return url += data;
  },

  /**
  * Parse URI
  *
  * @params {String} Tile url
  * @return {String} URI parsed
  */
  _parseUri: function (str) {
    var o = {
      strictMode: false,
      key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
      q:   {
        name:   "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    },
    mode   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i   = 14;

    while (i--) uri[o.key[i]] = mode[i] || "";

    uri[o.q.name] = {};

    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
      if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
  },

  /**
  * Zoom to cartodb geometries
  */
  setBounds: function(sql) {
    var
    self      = this,
    query     = "",
    tableName = this.get("table_name");

    if (sql) { // Custom query
      query = sql;
    } else { // Already defined query
      query = this.get("query");
    }

    var url = 'http://'+this.get("user_name")+'.cartodb.com/api/v1/sql/?q='+escape('select ST_Extent(the_geom) from '+ tableName);

    reqwest({
      url: url,
      type: 'jsonp',
      jsonpCallback: 'callback',
      success: function(result) {
        if (result.rows[0].st_extent!=null) {
          var coordinates = result.rows[0].st_extent.replace('BOX(','').replace(')','').split(',');
          var coor1 = coordinates[0].split(' ');
          var coor2 = coordinates[1].split(' ');

          var lon0 = coor1[0];
          var lat0 = coor1[1];
          var lon1 = coor2[0];
          var lat1 = coor2[1];

          var minlat = -85.0511;
          var maxlat =  85.0511;
          var minlon = -179;
          var maxlon =  179;

          /* Clamp X to be between min and max (inclusive) */
          var clampNum = function(x, min, max) {
            return x < min ? min : x > max ? max : x;
          }

          lon0 = clampNum(lon0, minlon, maxlon);
          lon1 = clampNum(lon1, minlon, maxlon);
          lat0 = clampNum(lat0, minlat, maxlat);
          lat1 = clampNum(lat1, minlat, maxlat);

          var sw = new L.LatLng(lat0, lon0);
          var ne = new L.LatLng(lat1, lon1);
          var bounds = new L.LatLngBounds(sw,ne);
          self.mapView.map_leaflet.fitBounds(bounds);
        }
      },
      error: function(e,msg) {
        if (this.options.debug) throw('Error getting table bounds: ' + msg);
      }
    });


  },

  /**
  * Generate tilejson for wax
  *
  * @return {Object} Options for L.TileLayer
  */
  _generateTileJson: function () {
    var
    core_url = this._generateURL("tiler"),
    base_url = core_url + '/tiles/' + this.get("table_name") + '/{z}/{x}/{y}',
    tile_url = base_url + '.png',
    grid_url = base_url + '.grid.json';

    var
    query         = this.get("query"),
    tableName     = this.get("table_name"),
    tileStyle     = this.get("tile_style"),
    interactivity = this.get("interactivity");
    extraParams   = this.get("extra_params");

    if (query) {
      var query = 'sql=' + encodeURIComponent(query.replace(/\{\{table_name\}\}/g, tableName));
      query = query.replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");

      tile_url = this._addUrlData(tile_url, query);
      grid_url = this._addUrlData(grid_url, query);
    }

    _.each(extraParams, function(value, name) {
      tile_url = this._addUrlData(tile_url, name + "=" + value);
      grid_url = this._addUrlData(grid_url, name + "=" + value);
    });

    if (tileStyle) {
      var style = 'style=' + encodeURIComponent(tileStyle.replace(/\{\{table_name\}\}/g, tableName));
      tile_url = this._addUrlData(tile_url, style);
      grid_url = this._addUrlData(grid_url, style);
    }

    if (interactivity) {
      var interactivity = 'interactivity=' + encodeURIComponent(interactivity.replace(/ /g,''));
      tile_url = this._addUrlData(tile_url, interactivity);
      grid_url = this._addUrlData(grid_url, interactivity);
    }

    // Build up the tileJSON
    return {
      blankImage: '../img/blank_tile.png',
      tilejson: '1.0.0',
      scheme: 'xyz',
      tiles: [tile_url],
      grids: [grid_url],
      tiles_base: tile_url,
      grids_base: grid_url,
      opacity: this.get("opacity"),
      formatter: function(options, data) {
        return data
      }
    };
  },

  /**
  * Get the point of the event in the map
  *
  * @params {Object} Map object
  * @params {Object} Wax event object
  */
  _findPos: function (map,o) {
    var
    curleft = curtop = 0,
    obj     = map._container;

    if (obj.offsetParent) {

      do { // Modern browsers
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);

      return map.containerPointToLayerPoint(new L.Point(o.pos.x - curleft,o.pos.y - curtop))

    } else { // IE
      return map.mouseEventToLayerPoint(o.e)
    }
  },

  /**
  * Bind events for wax interaction
  *
  * @param {Object} Layer map object
  * @param {Event} Wax event
  */
  _bindWaxEvents: function(map, o) {

    var
    layer_point = this._findPos(map, o),
    latlng      = map.layerPointToLatLng(layer_point);

    var featureOver  = this.get("featureOver");
    var featureClick = this.get("featureClick");

    switch (o.e.type) {
      case 'mousemove':
        if (featureOver) {
          return featureOver(o.e,latlng,o.pos,o.data);
        } else {
          if (this.get("debug")) throw('featureOver function not defined');
        }
        break;
      case 'click':
        if (featureClick) {
          featureClick(o.e,latlng,o.pos,o.data);
        } else {
          if (this.get("debug")) throw('featureClick function not defined');
        }
        break;
      case 'touched':
        if (featureClick) {
          featureClick(o.e,latlng,o.pos,o.data);
        } else {
          if (this.get("debug")) throw('featureClick function not defined');
        }
        break;
      default: break;
    }
  },

  getTileLayer: function() {

    if (this.get("interactivity")) {
      return this._getInteractiveLayer();
    }

    return this._getStaticTileLayer();
  },

  _getInteractiveLayer: function() {

    var self = this;

    this.tilejson = this._generateTileJson();
    this.layer    = new wax.leaf.connector(this.tilejson);

    var featureOver = function(o) { self._bindWaxEvents(self.mapView.map_leaflet, o)};
    var featureOut  = function() {

      var featureOut = self.get("featureOut");

      if (featureOut) {
        return featureOut && featureOut();
      } else {
        if (self.get("debug")) {
          throw('featureOut function not defined');
        }
      }
    };

    this.interaction = this.mapView.addInteraction(this.tilejson, featureOver, featureOut);

    return this.layer;
  },


  _getStaticTileLayer: function() {

    var // add the cartodb tiles
    style     = this.get("tile_style"),
    tableName = this.get("table_name"),
    query     = this.get("query");

    tileStyle  = (style) ? encodeURIComponent(style.replace(/\{\{table_name\}\}/g, tableName )) : '';
    query      = encodeURIComponent(query.replace(/\{\{table_name\}\}/g, tableName )).replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");

    var cartodb_url = this._generateURL("tiler") + '/tiles/' + tableName + '/{z}/{x}/{y}.png?sql=' + query +'&style=' + tileStyle;

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

  setView: function(latlng, zoom) {
    this.set({ center: latlng, zoom: zoom }, { silent: true });
    this.trigger("set_view");
  },

  setZoom: function(z) {
    this.set({zoom:z});
  },

  getZoom: function() {
    return this.get('zoom');
  },

  setCenter: function(latlng) {
    this.set({center: latlng});
  },

  /**
  * Change multiple options at the same time
  * @params {Object} New options object
  */
  setOptions: function(options) {
    if (typeof options!= "object" || options.length) {
      if (this.options.debug) {
        throw(options + ' options has to be an object');
      } else { return }
    }

    // Set options
    L.Util.setOptions(this, options);

    // Update tiles
    //this._update();
  },

  /**
  * Update CartoDB layer
  */
  _update: function() {
    // First remove old layer
    this.clearLayers();

    // Create the new updated one
    if (!this.options.interactivity) {
      this._addSimple();
    } else {
      this._addInteraction();
    }
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
  }
});


/**
* base view for all impl
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

    this.map.bind('set_view', this._setView);
    this.map.layers.bind('add', this._addLayer);
    this.map.layers.bind('remove', this._removeLayer);

    this._bindModel();

    this.map.layers.each(function(lyr) {
      self._addLayer(lyr);
    });

    this.map_leaflet.on('layeradd', function(lyr) {
      this.trigger('layeradd', lyr, self);
    }, this);

    this.map_leaflet.on('zoomend', function() {
      self._setModelProperty({ zoom: self.map_leaflet.getZoom() });
    }, this);

    this.map_leaflet.on('drag', function () {
      var c = self.map_leaflet.getCenter();
      self._setModelProperty({ center: [c.lat, c.lng] });
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

    return wax.leaf.interaction()
    .map(this.map_leaflet)
    .tilejson(tileJSON)
    .on('on',  featureOver)
    .on('off', featureOut);

  },

  _removeLayer: function(layer) {
    this.map_leaflet.removeLayer(layer.lyr);
  },

  _setView:function() {
    this.map_leaflet.setView(this.map.get("center"), this.map.get("zoom"));
  },

  _addLayer: function(layer) {
    var lyr;

    // Adds reference to the parent mapView
    layer.mapView = this;

    if ( layer.get('type') == "Tiled" ) {
      lyr = layer.getTileLayer();
    }

    if ( layer.get('type') == 'CartoDB') {
      lyr = layer.getTileLayer();
    }

    if (lyr) {
      layer.lyr = lyr;
      this.map_leaflet.addLayer(lyr);
    } else {
      cdb.log.error("layer type not supported");
    }
  }
});

