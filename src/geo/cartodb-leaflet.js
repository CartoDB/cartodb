/**
 * @name cartodb-leaflet
 * @author: Vizzuality.com
 * @fileoverview <b>Author:</b> Vizzuality.com<br/> <b>Licence:</b>
 *               Licensed under <a
 *               href="http://opensource.org/licenses/mit-license.php">MIT</a>
 *               license.<br/> This library lets you to use CartoDB with Leaflet.
 *
 */


if (typeof(L.CartoDBLayer) === "undefined") {


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

    /**
     * Initialize CartoDB Layer
     * @params {Object}
     *    map               -     Your Leaflet map
     *    user_name         -     CartoDB user name
     *    table_name        -     CartoDB table name
     *    query             -     If you want to apply any sql sentence to the table...
     *    opacity           -     If you want to change the opacity of the CartoDB layer
     *    tile_style        -     If you want to add other style to the layer
     *    interactivity     -     Get data from the feature clicked ( without any request :) )
     *    featureOver       -     Callback when user hovers a feature (return mouse event, latlng, position (x & y) and feature data)
     *    featureOut        -     Callback when user hovers out a feature
     *    featureClick      -     Callback when user clicks a feature (return mouse/touch event, latlng, position (x & y) and feature data)
     *    attribution       -     Set the attribution text
     *    debug             -     Get error messages from the library
     *    auto_bound        -     Let cartodb auto-bound-zoom in the map (opcional - default = false)
     *
     *    tiler_protocol    -     Tiler protocol (opcional - default = 'http')
     *    tiler_domain      -     Tiler domain (opcional - default = 'cartodb.com')
     *    tiler_port        -     Tiler port as a string (opcional - default = '80')
     *    sql_protocol      -     SQL API protocol (opcional - default = 'http')
     *    sql_domain        -     SQL API domain (opcional - default = 'cartodb.com')
     *    sql_port          -     SQL API port as a string (opcional - default = '80')
     *    extra_params      -     In case you want to pass aditional params to cartodb tiler, pass them
     *                            as an object
     *    cdn_url           -     If you want to use a CDN as a proxy set the URL
     */

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
      this.tilejson = this._generateTileJson();

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


    /**
     * Change opacity of the layer
     * @params {Integer} New opacity
     */
    setOpacity: function(opacity) {

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (isNaN(opacity) || opacity>1 || opacity<0) {
        if (this.options.debug) {
          throw(opacity + ' is not a valid value');
        } else { return }
      }

      // Leaflet only accepts 0-0.99... Weird!
      this.options.opacity = opacity;

      if (this.options.visible) {
        this.setOpacity(opacity == 1 ? 0.99 : opacity);
        this.fire('updated');
      }
    },


    /**
     * Change query of the tiles
     * @params {str} New sql for the tiles
     */
    setQuery: function(sql) {

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (!isNaN(sql)) {
        if (this.options.debug) {
         throw(sql + ' is not a valid query');
        } else { return }
      }

      // Set the new value to the layer options
      this.options.query = sql;
      this.__update();
    },


    /**
     * Change style of the tiles
     * @params {style} New carto for the tiles
     */
    setStyle: function(style) {

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (!isNaN(style)) {
        if (this.options.debug) {
          throw(style + ' is not a valid style');
        } else { return }
      }

      // Set the new value to the layer options
      this.options.tile_style = style;
      this.__update();
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

      // Set the new value to the layer options
      this.options.interactivity = value;
      // Update tiles
      this.__update();
    },


    /**
     * Active or desactive interaction
     * @params {Boolean} Choose if wants interaction or not
     */
    setInteraction: function(bool) {

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (bool !== false && bool !== true) {
        if (this.options.debug) {
          throw(bool + ' is not a valid setInteraction value');
        } else { return }
      }

      if (this.interaction) {
        if (bool) {
          var self = this;
          this.interaction.on('on', function(o) {self._bindWaxOnEvents(self.options.map,o)});
          this.interaction.on('off', function(o) {self._bindWaxOffEvents()});
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

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (!isNaN(attribution)) {
        if (this.options.debug) {
          throw(attribution + ' is not a valid attribution');
        } else { return }
      }

      // Remove old one
      this.options.map.attributionControl.removeAttribution(this.options.attribution);

      // Set new attribution in the options
      this.options.attribution = attribution;

      // Change text
      this.options.map.attributionControl.addAttribution(this.options.attribution);

      // Change in the layer
      this.options.attribution = this.options.attribution;
      this.tilejson.attribution = this.options.attribution;

      this.fire('updated');
    },


    /**
     * Change multiple options at the same time
     * @params {Object} New options object
     */
    setOptions: function(options) {

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (typeof options!= "object" || options.length) {
        if (this.options.debug) {
          throw(options + ' options has to be an object');
        } else { return }
      }

      // Set options
      L.Util.setOptions(this, options);

      // Update tiles
      this.__update();
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
     * Hide the CartoDB layer
     */
    hide: function() {

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (!this.options.visible) {
        if (this.options.debug) {
          throw('the layer is already hidden');
        } else { return }
      }

      this.setOpacity(0);
      this.setInteraction(false);
      this.options.visible = false;
      this.fire('hidden');
    },


    /**
     * Show the CartoDB layer
     */
    show: function() {

      if (!this.options.added) {
        if (this.options.debug) {
          throw('the layer is not still added to the map');
        } else { return }
      }

      if (this.options.visible) {
        if (this.options.debug) {
          throw('the layer is already shown');
        } else { return }
      }

      this.setOpacity(this.options.opacity);
      this.setInteraction(true);
      this.options.visible = true;
      this.fire('shown');
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
        cartodb_link.setAttribute('style',"position:absolute; bottom:8px; left:8px; display:block; z-index:10000;");
        cartodb_link.setAttribute('href','http://www.cartodb.com');
        cartodb_link.setAttribute('target','_blank');
        cartodb_link.innerHTML = "<img src='http://cartodb.s3.amazonaws.com/static/new_logo.png' style='border:none; outline:none' alt='CartoDB' title='CartoDB' />";
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
        case 'mousemove': if (this.options.featureOver) {
                            return this.options.featureOver(o.e,latlng,{x: o.e.clientX, y: o.e.clientY},o.data);
                          } else {
                            if (this.options.debug) throw('featureOver function not defined');
                          }
                          break;
        case 'click':   if (this.options.featureClick) {
                            this.options.featureClick(o.e,latlng,{x: o.e.clientX, y: o.e.clientY},o.data);
                          } else {
                            if (this.options.debug) throw('featureClick function not defined');
                          }
                          break;
        case 'touchend':  if (this.options.featureClick) {
                            this.options.featureClick(o.e,latlng,{x: o.e.clientX, y: o.e.clientY},o.data);
                          } else {
                            if (this.options.debug) throw('featureClick function not defined');
                          }
                          break;
        default:          break;
      }
    },


    /**
     * Bind off event for wax interaction
     */
    _bindWaxOffEvents: function(){
      if (this.options.featureOut) {
        return this.options.featureOut && this.options.featureOut();
      } else {
        if (this.options.debug) throw('featureOut function not defined');
      }
    },


    /**
     * Generate tilejson for wax
     * @return {Object} Options for L.TileLayer
     */
    _generateTileJson: function () {

      var urls = this._generateTileUrls();

      // Build up the tileJSON
      return {
        blankImage: '../img/blank_tile.png',
        tilejson: '1.0.0',
        scheme: 'xyz',
        attribution: this.options.attribution,
        tiles: [urls.tile_url],
        grids: [urls.grid_url],
        tiles_base: urls.tile_url,
        grids_base: urls.grid_url,
        opacity: this.options.opacity,
        formatter: function(options, data) {
          return data
        }
      };
    },



    /*
     * HELPER FUNCTIONS
     */


    /**
     * Parse URI
     * @params {String} Tile url
     * @return {String} URI parsed
     */
    _parseUri: function (str) {
      var o = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
          name:   "queryKey",
          parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
          strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
          loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
      },
      m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
      uri = {},
      i   = 14;

      while (i--) uri[o.key[i]] = m[i] || "";

      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
      });
      return uri;
    },


    /**
     * Appends callback onto urls regardless of existing query params
     * @params {String} Tile url
     * @params {String} Tile data
     * @return {String} Tile url parsed
     */
    _addUrlData: function (url, data) {
      url += (this._parseUri(url).query) ? '&' : '?';
      return url += data;
    },


    /**
     * Generate the core URL for the tiler
     * @params {String} Options including tiler_protocol, user_name, tiler_domain and tiler_port
     */
    _generateCoreUrl: function(type){
      //First check if we are using a CDN which in that case we dont need to do all this.
      if (this.options.cdn_url) {
        return this.options.cdn_url;
      }

      if (type == "sql") {
         return this.options.sql_protocol +
             "://" + ((this.options.user_name)?this.options.user_name+".":"")  +
             this.options.sql_domain +
             ((this.options.sql_port != "") ? (":" + this.options.sql_port) : "");
       } else {
         return this.options.tiler_protocol +
             "://" + ((this.options.user_name)?this.options.user_name+".":"")  +
             this.options.tiler_domain +
             ((this.options.tiler_port != "") ? (":" + this.options.tiler_port) : "");
       }
    },


    /**
     * Generate the final tile and grid URLs for the tiler
     */
    _generateTileUrls: function() {
      var core_url = this._generateCoreUrl("tiler")
        , base_url = core_url + '/tiles/' + this.options.table_name + '/{z}/{x}/{y}'
        , tile_url = base_url + '.png'
        , grid_url = base_url + '.grid.json';

      // SQL?
      if (this.options.query) {
        var q = encodeURIComponent(this.options.query.replace(/\{\{table_name\}\}/g,this.options.table_name));
        q = q.replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");
        var query = 'sql=' +  q
        tile_url = this._addUrlData(tile_url, query);
        grid_url = this._addUrlData(grid_url, query);
      }

      // EXTRA PARAMS?
      for (_param in this.options.extra_params) {
        tile_url = this._addUrlData(tile_url, _param+"="+this.options.extra_params[_param]);
        grid_url = this._addUrlData(grid_url, _param+"="+this.options.extra_params[_param]);
      }

      // STYLE?
      if (!this.options.use_server_style && this.options.tile_style) {
        var style = 'style=' + encodeURIComponent(this.options.tile_style.replace(/\{\{table_name\}\}/g,this.options.table_name));
        tile_url = this._addUrlData(tile_url, style);
        grid_url = this._addUrlData(grid_url, style);
      }

      // INTERACTIVITY?
      if (this.options.interactivity) {
        var interactivity = 'interactivity=' + encodeURIComponent(this.options.interactivity.replace(/ /g,''));
        tile_url = this._addUrlData(tile_url, interactivity);
        grid_url = this._addUrlData(grid_url, interactivity);
      }

      return {
        core_url: core_url,
        base_url: base_url,
        tile_url: tile_url,
        grid_url: grid_url
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
    },


    /**
     *  Check the tiles
     */
    _checkTiles: function() {
      var xyz = {z: 4, x: 6, y: 6}
        , self = this
        , img = new Image()
        , urls = this._generateTileUrls()

      // Choose a x-y-z for the check tile - grid
      urls.tile_url = urls.tile_url.replace(/\{z\}/g,xyz.z).replace(/\{x\}/g,xyz.x).replace(/\{y\}/g,xyz.y);
      urls.grid_url = urls.grid_url.replace(/\{z\}/g,xyz.z).replace(/\{x\}/g,xyz.x).replace(/\{y\}/g,xyz.y);


      reqwest({
        method: "get",
        url: urls.grid_url,
        type: 'jsonp',
        jsonpCallback: 'callback',
        jsonpCallbackName: 'grid',
        success: function() {
          clearTimeout(timeout)
        },
        error: function(error,msg) {
          if (self.interaction)
            self.interaction.remove();

          if (self.options.debug)
            throw('There is an error in your query or your interaction parameter');

          self.fire("layererror", msg);
        }
      });

      // Hacky for reqwest, due to timeout doesn't work very well
      var timeout = setTimeout(function(){
        clearTimeout(timeout);

        if (self.interaction)
          self.interaction.remove();

        if (self.options.debug)
          throw('There is an error in your query or your interaction parameter');

        self.fire("layererror", "There is a problem in your SQL or interaction parameter");
      },2000);
    }

  });
}

