
(function() {

if(typeof(L) == "undefined")
  return;


L.CartoDBGroupLayerBase = L.TileLayer.extend({

  interactionClass: wax.leaf.interaction,

  includes: [
    cdb.geo.LeafLetLayerView.prototype,
    //LayerDefinition.prototype,
    CartoDBLayerCommon.prototype
  ],

  options: {
    opacity:        0.99,
    attribution:    "CartoDB",
    debug:          false,
    visible:        true,
    added:          false,
    tiler_domain:   "cartodb.com",
    tiler_port:     "80",
    tiler_protocol: "http",
    sql_api_domain:     "cartodb.com",
    sql_api_port:       "80",
    sql_api_protocol:   "http",
    maxZoom: 30, // default leaflet zoom level for a layers is 18, raise it 
    extra_params:   {
    },
    cdn_url:        null,
    subdomains:     null
  },


  initialize: function (options) {
    options = options || {};
    // Set options
    L.Util.setOptions(this, options);

    // Some checks
    if (!options.layer_definition && !options.sublayers) {
        throw new Error('cartodb-leaflet needs at least the layer_definition or sublayer list');
    }

    if(!options.layer_definition) {
      this.options.layer_definition = LayerDefinition.layerDefFromSubLayers(options.sublayers);
    }

    LayerDefinition.call(this, this.options.layer_definition, this.options);

    this.fire = this.trigger;

    CartoDBLayerCommon.call(this);
    L.TileLayer.prototype.initialize.call(this);
    this.interaction = [];
    this.addProfiling();
  },

  addProfiling: function() {
    this.bind('tileloadstart', function(e) {
      var s = this.tileStats || (this.tileStats = {});
      s[e.tile.src] = cartodb.core.Profiler.metric('cartodb-js.tile.png.load.time').start();
    });
    var finish = function(e) {
      var s = this.tileStats && this.tileStats[e.tile.src];
      s && s.end();
    };
    this.bind('tileload', finish);
    this.bind('tileerror', function(e) {
      cartodb.core.Profiler.metric('cartodb-js.tile.png.error').inc();
      finish(e);
    });
  },


  // overwrite getTileUrl in order to
  // support different tiles subdomains in tilejson way
  getTileUrl: function (tilePoint) {
    var EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    this._adjustTilePoint(tilePoint);

    var tiles = [EMPTY_GIF];
    if(this.tilejson) {
      tiles = this.tilejson.tiles;
    }

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

    if (isNaN(opacity) || opacity>1 || opacity<0) {
      throw new Error(opacity + ' is not a valid value');
    }

    // Leaflet only accepts 0-0.99... Weird!
    this.options.opacity = Math.min(opacity, 0.99);

    if (this.options.visible) {
      L.TileLayer.prototype.setOpacity.call(this, this.options.opacity);
      this.fire('updated');
    }
  },


  /**
   * When Leaflet adds the layer... go!
   * @params {map}
   */
  onAdd: function(map) {
    var self = this;
    this.options.map = map;
    
    // Add cartodb logo
    if (this.options.cartodb_logo != false)
      cdb.geo.common.CartoDBLogo.addWadus({ left:8, bottom:8 }, 0, map._container);

    this.__update(function() {
      // if while the layer was processed in the server is removed
      // it should not be added to the map
      var id = L.stamp(self);
      if (!map._layers[id]) { 
        return; 
      }

      L.TileLayer.prototype.onAdd.call(self, map);
      self.fire('added');
      self.options.added = true;
    });
  },


  /**
   * When removes the layer, destroy interactivity if exist
   */
  onRemove: function(map) {
    if(this.options.added) {
      this.options.added = false;
      L.TileLayer.prototype.onRemove.call(this, map);
    }
  },

  /**
   * Update CartoDB layer
   * generates a new url for tiles and refresh leaflet layer
   * do not collide with leaflet _update
   */
  __update: function(done) {
    var self = this;
    this.fire('updated');
    this.fire('loading');
    var map = this.options.map;

    this.getTiles(function(urls, err) {
      if(urls) {
        self.tilejson = urls;
        self.setUrl(self.tilejson.tiles[0]);
        // manage interaction
        self._reloadInteraction();
        self.ok && self.ok();
        done && done();
      } else {
        self.error && self.error(err);
        done && done();
      }
    });
  },


  _checkLayer: function() {
    if (!this.options.added) {
      throw new Error('the layer is not still added to the map');
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
   * Bind events for wax interaction
   * @param {Object} Layer map object
   * @param {Event} Wax event
   */
  _manageOnEvents: function(map, o) {
    var layer_point = this._findPos(map,o),
        latlng = map.layerPointToLatLng(layer_point);
    var event_type = o.e.type.toLowerCase();


    var screenPos = map.layerPointToContainerPoint(layer_point);

    switch (event_type) {
      case 'mousemove':
        if (this.options.featureOver) {
          return this.options.featureOver(o.e,latlng, screenPos, o.data, o.layer);
        }
        break;

      case 'click':
      case 'touchend':
      case 'mspointerup':
        if (this.options.featureClick) {
          this.options.featureClick(o.e,latlng, screenPos, o.data, o.layer);
        }
        break;
      default:
        break;
    }
  },


  /**
   * Bind off event for wax interaction
   */
  _manageOffEvents: function(map, o) {
    if (this.options.featureOut) {
      return this.options.featureOut && this.options.featureOut(o.e, o.layer);
    }
  },

  /**
   * Get the Leaflet Point of the event
   * @params {Object} Map object
   * @params {Object} Wax event object
   */
  _findPos: function (map,o) {
    var curleft = 0, curtop = 0;
    var obj = map.getContainer();

    var x, y;
    if (o.e.changedTouches && o.e.changedTouches.length > 0) {
      x = o.e.changedTouches[0].clientX + window.scrollX;
      y = o.e.changedTouches[0].clientY + window.scrollY;
    } else {
      x = o.e.clientX;
      y = o.e.clientY;
    }

    if (obj.offsetParent) {
      // Modern browsers
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      return map.containerPointToLayerPoint(new L.Point(x - curleft, y - curtop));
    } else {
      var rect = obj.getBoundingClientRect();
      var p = new L.Point(
            o.e.clientX - rect.left - obj.clientLeft - window.scrollX,
            o.e.clientY - rect.top - obj.clientTop - window.scrollY);
      return map.containerPointToLayerPoint(p);
    }
  }

});

L.CartoDBGroupLayer = L.CartoDBGroupLayerBase.extend({
  includes: [
    LayerDefinition.prototype,
  ]
});

function layerView(base) {
  var layerViewClass = base.extend({

    includes: [
      cdb.geo.LeafLetLayerView.prototype,
      Backbone.Events
    ],

    initialize: function(layerModel, leafletMap) {
      var self = this;
      var hovers = [];

      // CartoDB new attribution,
      // also we have the logo
      layerModel.attributes.attribution = cdb.config.get('cartodb_attributions');

      var opts = _.clone(layerModel.attributes);

      opts.map =  leafletMap;

      var // preserve the user's callbacks
      _featureOver  = opts.featureOver,
      _featureOut   = opts.featureOut,
      _featureClick = opts.featureClick;

      var previousEvent;
      var eventTimeout = -1;

      opts.featureOver  = function(e, latlon, pxPos, data, layer) {
        if (!hovers[layer]) {
          self.trigger('layerenter', e, latlon, pxPos, data, layer);
        }
        hovers[layer] = 1;
        _featureOver  && _featureOver.apply(this, arguments);
        self.featureOver  && self.featureOver.apply(self, arguments);
        // if the event is the same than before just cancel the event
        // firing because there is a layer on top of it
        if (e.timeStamp === previousEvent) {
          clearTimeout(eventTimeout);
        }
        eventTimeout = setTimeout(function() {
          self.trigger('mouseover', e, latlon, pxPos, data, layer);
          self.trigger('layermouseover', e, latlon, pxPos, data, layer);
        }, 0);
        previousEvent = e.timeStamp;

      };

      opts.featureOut  = function(m, layer) {
        if (hovers[layer]) {
          self.trigger('layermouseout', layer);
        }
        hovers[layer] = 0;
        if(!_.any(hovers)) {
          self.trigger('mouseout');
        }
        _featureOut  && _featureOut.apply(this, arguments);
        self.featureOut  && self.featureOut.apply(self, arguments);
      };

      opts.featureClick  = _.debounce(function() {
        _featureClick  && _featureClick.apply(self, arguments);
        self.featureClick  && self.featureClick.apply(self, arguments);
      }, 10);

      base.prototype.initialize.call(this, opts);
      cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);

    },

    featureOver: function(e, latlon, pixelPos, data, layer) {
      // dont pass leaflet lat/lon
      this.trigger('featureOver', e, [latlon.lat, latlon.lng], pixelPos, data, layer);
    },

    featureOut: function(e, layer) {
      this.trigger('featureOut', e, layer);
    },

    featureClick: function(e, latlon, pixelPos, data, layer) {
      // dont pass leaflet lat/lon
      this.trigger('featureClick', e, [latlon.lat, latlon.lng], pixelPos, data, layer);
    },

    error: function(e) {
      this.trigger('error', e ? e.errors : 'unknown error');
      this.model.trigger('error', e?e.errors:'unknown error');
    },

    ok: function(e) {
      this.model.trigger('tileOk');
    },

    onLayerDefinitionUpdated: function() {
      this.__update();
    }

  });

  return layerViewClass;
}

L.NamedMap = L.CartoDBGroupLayerBase.extend({
  includes: [
    cdb.geo.LeafLetLayerView.prototype,
    NamedMap.prototype,
    CartoDBLayerCommon.prototype
  ],

  initialize: function (options) {
    options = options || {};
    // Set options
    L.Util.setOptions(this, options);

    // Some checks
    if (!options.named_map && !options.sublayers) {
        throw new Error('cartodb-leaflet needs at least the named_map');
    }

    /*if(!options.layer_definition) {
      this.options.layer_definition = LayerDefinition.layerDefFromSubLayers(options.sublayers);
    }*/

    NamedMap.call(this, this.options.named_map, this.options);

    this.fire = this.trigger;

    CartoDBLayerCommon.call(this);
    L.TileLayer.prototype.initialize.call(this);
    this.interaction = [];
    this.addProfiling();
  }
});

cdb.geo.LeafLetCartoDBLayerGroupView = layerView(L.CartoDBGroupLayer);
cdb.geo.LeafLetCartoDBNamedMapView = layerView(L.NamedMap);

})();
