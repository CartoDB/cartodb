
if(typeof(L) == "undefined")
  return;

L.CartoDBGroupLayer = L.TileLayer.extend({

  includes: [
    cdb.geo.LeafLetLayerView.prototype,
    LayerDefinition.prototype,
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
    sql_domain:     "cartodb.com",
    sql_port:       "80",
    sql_protocol:   "http",
    extra_params:   {},
    cdn_url:        null,
    subdomains:     null
  },


  initialize: function (options) {
    // Set options
    L.Util.setOptions(this, options);

    // Some checks
    if (!options.layer_definition) {
        throw new Error('cartodb-leaflet needs at least the layer_definition');
    }

    LayerDefinition.call(this, options.layer_definition, this.options);


    this.fire = this.trigger;

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
    this._addWadus({left:8, bottom:8}, 0, map._container);
    this.__update(function() {
      L.TileLayer.prototype.onAdd.call(self, map);
      self.fire('added');
      self.options.added = true;
    });
  },


  /**
   * When removes the layer, destroy interactivity if exist
   */
  onRemove: function(map) {
    this.options.added = false;
    L.TileLayer.prototype.onRemove.call(this, map);
  },

  onLayerDefinitionUpdated: function() {
    this.__update();
  },

  /**
   * Update CartoDB layer
   * generates a new url for tiles and refresh leaflet layer
   * do not collide with leaflet _update
   */
  __update: function(done) {
    var self = this;
    this.fire('updated');

    this.getTiles(function(urls) {
      if(urls) {
        self.tilejson = urls;
        self.setUrl(self.tilejson.tiles[0]);
        done && done();
      } else {
        //TODO: manage error
      }
    });
    // generate the tilejson

    // check the tiles
    //this._checkTiles();

    /*
    if(this.interaction) {
      this.interaction.remove();
      this.interaction = null;
    }
    */

    // add the interaction?
    /*
    if (this.options.interactivity && this.options.interaction) {
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
    */

  },

  enableInteraction: function(layer) {
    var self = this;
    this.interaction = wax.leaf.interaction()
      .map(this.options.map)
      .tilejson(this._getTileJSON(this.tilejson, layer))
      .on('on', function(o) {
        o.layer = layer;
        self._bindWaxOnEvents(self.options.map, o);
      })
      .on('off', function(o) {
        self._bindWaxOffEvents();
      });
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
  setQuery: function(layer, sql) {

    this._checkLayer();

    /*this.setOptions({
      query: sql
    });*/

  },


  /**
   * Change style of the tiles
   * @params {style} New carto for the tiles
   */
  setCartoCSS: function(layer, style, version) {
    this._checkLayer();

    version = version || cdb.CARTOCSS_DEFAULT_VERSION;

    /*this.setOptions({
      tile_style: style,
      style_version: version
    });*/

  },


  /**
   * Change the query when clicks in a feature
   * @params {Boolean | String} New sql for the request
   */
  setInteractivity: function(value) {
/*
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
    */

  },


  /**
   * Active or desactive interaction
   * @params {Boolean} Choose if wants interaction or not
   */
  setInteraction: function(enable) {
    /*this.setOptions({
      interaction: enable
    })*/
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
  /*setOptions: function(opts) {

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

    // Update tiles
    if(opts.query != undefined || opts.style != undefined || opts.tile_style != undefined || opts.interactivity != undefined || opts.interaction != undefined) {
      this.__update();
    }
  },*/


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
   * Bind events for wax interaction
   * @param {Object} Layer map object
   * @param {Event} Wax event
   */
  _bindWaxOnEvents: function(map,o) {
    var layer_point = this._findPos(map,o),
        latlng = map.layerPointToLatLng(layer_point);

    var screenPos = map.layerPointToContainerPoint(layer_point);

    switch (o.e.type) {

      case 'mousemove':
        if (this.options.featureOver) {
          return this.options.featureOver(o.e,latlng, screenPos, o.data);
        }
        break;

      case 'click':
      case 'touchend':
        if (this.options.featureClick) {
          this.options.featureClick(o.e,latlng, screenPos, o.data);
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
    var curleft = 0, curtop = 0;
    var obj = map.getContainer();


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
