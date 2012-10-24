/**
 * @name cartodb-leaflet
 * @author: Vizzuality.com
 * @fileoverview <b>Author:</b> Vizzuality.com<br/> <b>Licence:</b>
 *               Licensed under <a
 *               href="http://opensource.org/licenses/mit-license.php">MIT</a>
 *               license.<br/> This library lets you to use CartoDB with Leaflet.
 *
 */


(function() {

if(typeof(L) == "undefined")
  return;

L.CartoDBLayer = L.TileLayer.extend({

  options: {
    query:          "SELECT * FROM {{table_name}}",
    opacity:        0.99,
    auto_bound:     false,
    attribution:    "CartoDB",
    debug:          false,
    visible:        true,
    added:          false,
    tiler_domain:   "cartodb.com",
    tiler_port:     "80",
    tiler_protocol: "http",
    sql_domain:     "cartodb.com",
    sql_port:       "80",
    sql_protocol:   "http",
    extra_params:   {},
    cdn_url:        null
  },


  initialize: function (options) {
    // Set options
    L.Util.setOptions(this, options);

    // Some checks
    if (!options.table_name || !options.map) {
      if (options.debug) {
        throw('cartodb-leaflet needs at least a CartoDB table name and the Leaflet map object :(');
      } else { return }
    }

    // Bounds? CartoDB does it
    if (options.auto_bound)
      this.setBounds();

    // Add cartodb logo, yes sir!
    this._addWadus();

    L.TileLayer.prototype.initialize.call(this);
  },


  // overwrite getTileUrl in order to
  // support different tiles subdomains in tilejson way
  getTileUrl: function (tilePoint) {
    this._adjustTilePoint(tilePoint);

    var tiles = this.tilejson.tiles;

    var index = (tilePoint.x + tilePoint.y) % tiles.length;

    return L.Util.template(tiles[index], L.Util.extend({
      z: this._getZoomForUrl(),
      x: tilePoint.x,
      y: tilePoint.y
    }, this.options));
  },

  /**
   * Change opacity of the layer
   * @params {Integer} New opacity
   */
  setOpacity: function(opacity) {

    this._checkLayer();

    if (isNaN(opacity) || opacity>1 || opacity<0) {
      throw new Error(opacity + ' is not a valid value');
    }

    // Leaflet only accepts 0-0.99... Weird!
    this.options.opacity = Math.min(opacity, 0.99);

    if (this.options.visible) {
      L.TileLayer.prototype.setOpacity.call(this,  opacity);
      this.fire('updated');
    }
  },


  /**
   * When Leaflet adds the layer... go!
   * @params {map}
   */
  onAdd: function(map) {
    this.__update();
    this.fire('added');
    this.options.added = true;
    L.TileLayer.prototype.onAdd.call(this, map);
  },


  /**
   * When removes the layer, destroy interactivity if exist
   */
  onRemove: function(map) {
    this.options.added = false;
    L.TileLayer.prototype.onRemove.call(this, map);
  },

  /**
   * Update CartoDB layer
   * generates a new url for tiles and refresh leaflet layer
   * do not collide with leaflet _update
   */
  __update: function() {
    var self = this;
    this.fire('updated');

    // generate the tilejson
    this.tilejson = this._tileJSON();

    // check the tiles
    this._checkTiles();

    // add the interaction?
    if (this.options.interactivity) {
      if(this.interaction) {
        this.interaction.remove();
        this.interaction = null;
      }
      this.interaction = wax.leaf.interaction()
        .map(this.options.map)
        .tilejson(this.tilejson)
        .on('on', function(o) {
          self._bindWaxOnEvents(self.options.map,o)
        })
        .on('off', function(o) {
          self._bindWaxOffEvents()
        });
    }

    this.setUrl(this.tilejson.tiles[0]);
  },

  _checkLayer: function() {
    if (!this.options.added) {
      throw new Error('the layer is not still added to the map');
    }
  },



  /**
   * Change query of the tiles
   * @params {str} New sql for the tiles
   */
  setQuery: function(sql) {

    this._checkLayer();

    this.setOptions({
      query: sql
    });

  },


  /**
   * Change style of the tiles
   * @params {style} New carto for the tiles
   */
  setCartoCSS: function(style, version) {
    this._checkLayer();

    version = version || cdb.CARTOCSS_DEFAULT_VERSION;

    this.setOptions({
      tile_style: style,
      style_version: version
    });

  },


  /**
   * Change the query when clicks in a feature
   * @params {Boolean | String} New sql for the request
   */
  setInteractivity: function(value) {

    if (!this.options.added) {
      if (this.options.debug) {
        throw('the layer is not still added to the map');
      } else { return }
    }

    if (!isNaN(value)) {
      if (this.options.debug) {
        throw(value + ' is not a valid setInteractivity value');
      } else { return }
    }

    this.setOptions({
      interactivity: value
    });

  },


  /**
   * Active or desactive interaction
   * @params {Boolean} Choose if wants interaction or not
   */
  setInteraction: function(enable) {
    var self = this;

    this._checkLayer();

    if (this.interaction) {
      if (enable) {
        this.interaction.on('on', function(o) {
          self._bindWaxOnEvents(self.options.map, o)
        });
        this.interaction.on('off', function(o) {
          self._bindWaxOffEvents()
        });
      } else {
        this.interaction.off('on');
        this.interaction.off('off');
      }
    }
  },


  /**
   * Set a new layer attribution
   * @params {String} New attribution string
   */
  setAttribution: function(attribution) {

    this._checkLayer();

    // Remove old one
    this.map.attributionControl.removeAttribution(this.options.attribution);

    // Set new attribution in the options
    this.options.attribution = attribution;

    // Change text
    this.map.attributionControl.addAttribution(this.options.attribution);

    // Change in the layer
    this.options.attribution = this.options.attribution;
    this.tilejson.attribution = this.options.attribution;

    this.fire('updated');
  },


  /**
   * Change multiple options at the same time
   * @params {Object} New options object
   */
  setOptions: function(opts) {

    if (typeof opts != "object" || opts.length) {
      throw new Error(opts + ' options has to be an object');
    }

    L.Util.setOptions(this, opts);

    if(opts.interactivity) {
      var i = opts.interactivity;
      this.options.interactivity = i.join ? i.join(','): i;
    }
    if(opts.opacity !== undefined) {
      this.setOpacity(this.options.opacity);
    }
    if(opts.interaction !== undefined) {
      this.setInteraction(this.options.interaction);
    }

    // Update tiles
    if(opts.query || opts.style || opts.tile_style || opts.interactivity) {
      this.__update();
    }
  },


  /**
   * Returns if the layer is visible or not
   */
  isVisible: function() {
    return this.options.visible
  },


  /**
   * Returns if the layer belongs to the map
   */
  isAdded: function() {
    return this.options.added
  },


  /**
   * Zoom to cartodb geometries
   */
  setBounds: function(sql) {
    var self = this
      , query = "";

    if (sql) {
      // Custom query
      query = sql;
    } else {
      // Already defined query
      query = this.options.query;
    }

    reqwest({
      url: this._generateCoreUrl("sql") + '/api/v2/sql/?q='+escape('SELECT ST_XMin(ST_Extent(the_geom)) as minx,ST_YMin(ST_Extent(the_geom)) as miny,'+
        'ST_XMax(ST_Extent(the_geom)) as maxx,ST_YMax(ST_Extent(the_geom)) as maxy from ('+ query.replace(/\{\{table_name\}\}/g,this.options.table_name) + ') as subq'),
      type: 'jsonp',
      jsonpCallback: 'callback',
      success: function(result) {
        if (result.rows[0].maxx!=null) {
          var coordinates = result.rows[0];

          var lon0 = coordinates.maxx;
          var lat0 = coordinates.maxy;
          var lon1 = coordinates.minx;
          var lat1 = coordinates.miny;

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
          self.options.map.fitBounds(bounds);
        }
      },
      error: function(e,msg) {
        if (this.options.debug) throw('Error getting table bounds: ' + msg);
      }
    });
  },


  /**
   * Add Cartodb logo
   */
  _addWadus: function() {
    if (!document.getElementById('cartodb_logo')) {
      var cartodb_link = document.createElement("a");
      cartodb_link.setAttribute('id','cartodb_logo');
      cartodb_link.setAttribute('style',"position:absolute; bottom:0; left:0; display:block; z-index:10000;");
      cartodb_link.setAttribute('href','http://www.cartodb.com');
      cartodb_link.setAttribute('target','_blank');
      cartodb_link.innerHTML = "<img src='http://cartodb.s3.amazonaws.com/static/new_logo.png' style='position:absolute; bottom:8px; left:8px; display:block; border:none; outline:none' alt='CartoDB' title='CartoDB' />";
      this.options.map._container.appendChild(cartodb_link);
    }
  },


  /**
   * Bind events for wax interaction
   * @param {Object} Layer map object
   * @param {Event} Wax event
   */
  _bindWaxOnEvents: function(map,o) {
    var layer_point = this._findPos(map,o)
      , latlng = map.layerPointToLatLng(layer_point);

    switch (o.e.type) {

      case 'mousemove':
        if (this.options.featureOver) {
          return this.options.featureOver(o.e,latlng, { x: o.e.clientX, y: o.e.clientY }, o.data);
        }
        break;

      case 'click':
      case 'touchend':
        if (this.options.featureClick) {
          this.options.featureClick(o.e,latlng, { x: o.e.clientX, y: o.e.clientY }, o.data);
        }
        break;
      default:
        break;
    }
  },


  /**
   * Bind off event for wax interaction
   */
  _bindWaxOffEvents: function(){
    if (this.options.featureOut) {
      return this.options.featureOut && this.options.featureOut();
    }
  },

  /**
   * Get the Leaflet Point of the event
   * @params {Object} Map object
   * @params {Object} Wax event object
   */
  _findPos: function (map,o) {
    var curleft = curtop = 0;
    var obj = map._container;


    if (obj.offsetParent) {
      // Modern browsers
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      return map.containerPointToLayerPoint(new L.Point((o.e.clientX || o.e.changedTouches[0].clientX) - curleft,(o.e.clientY || o.e.changedTouches[0].clientY) - curtop))
    } else {
      // IE
      return map.mouseEventToLayerPoint(o.e)
    }
  }

});

/**
 * leatlet cartodb layer
 */

var LeafLetLayerCartoDBView = function(layerModel, leafletMap) {
  var self = this;

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

  var opts = _.clone(layerModel.attributes);
  if(layerModel.get('use_server_style')) {
    opts.tile_style = null;
  }

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

  L.CartoDBLayer.call(this, opts);
  cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);
};

_.extend(L.CartoDBLayer.prototype, CartoDBLayerCommon.prototype);

_.extend(
  LeafLetLayerCartoDBView.prototype, 
  cdb.geo.LeafLetLayerView.prototype,
  L.CartoDBLayer.prototype,
  Backbone.Events, // be sure this is here to not use the on/off from leaflet
  {

  _modelUpdated: function() {
    var attrs = _.clone(this.model.attributes);
    // if we want to use the style stored in the server
    // but we want to store it in the layer model
    // we should remove it from layer options
    if(this.model.get('use_server_style')) {
      attrs.tile_style = null;
    } 
    this.leafletLayer.setOptions(attrs);
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
  },

  reload: function() {
    this.redraw();
  },

  error: function(e) {
    this.trigger('error', e?e.error:'unknown error');
  }

});

cdb.geo.LeafLetLayerCartoDBView = LeafLetLayerCartoDBView;

})();
