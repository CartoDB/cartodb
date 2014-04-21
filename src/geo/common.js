
/*
 *  common functions for cartodb connector
 */

function CartoDBLayerCommon() {
}

CartoDBLayerCommon.prototype = {

  // the way to show/hidelayer is to set opacity
  // removing the interactivty at the same time
  show: function() {
    this.setOpacity(this.options.previous_opacity === undefined ? 0.99: this.options.previous_opacity);
    delete this.options.previous_opacity;
    this._interactionDisabled = false;
  },

  hide: function() {
    if(this.options.previous_opacity == undefined) {
      this.options.previous_opacity = this.options.opacity;
    }
    this.setOpacity(0);
    // disable here interaction for all the layers
    this._interactionDisabled = true;
  },

  /**
   * Returns if the layer is visible or not
   */
  isVisible: function() {
    return this.visible;
  },

  /**
   * Active or desactive interaction
   * @params enable {Number} layer number
   * @params layer {Boolean} Choose if wants interaction or not
   */
  setInteraction: function(layer, b) {
    // shift arguments to maintain caompatibility
    if(b == undefined) {
      b = layer;
      layer = 0;
    }
    var layerInteraction;
    this.interactionEnabled[layer] = b;
    if(!b) {
      layerInteraction = this.interaction[layer];
      if(layerInteraction) {
        layerInteraction.remove();
        this.interaction[layer] = null;
      }
    } else {
      // if urls is null it means that setInteraction will be called
      // when the layergroup token was recieved, then the real interaction
      // layer will be created
      if(this.urls) {
        // generate the tilejson from the urls. wax needs it
        var layer_index = this.getLayerIndexByNumber(+layer);
        var tilejson = this._tileJSONfromTiles(layer_index, this.urls);

        // remove previous
        layerInteraction = this.interaction[layer];
        if(layerInteraction) {
          layerInteraction.remove();
        }
        var self = this;

        // add the new one
        this.interaction[layer] = this.interactionClass()
          .map(this.options.map)
          .tilejson(tilejson)
          .on('on', function(o) {
            if (self._interactionDisabled) return;
            o.layer = +layer;
            self._manageOnEvents(self.options.map, o);
          })
          .on('off', function(o) {
            if (self._interactionDisabled) return;
            o = o || {}
            o.layer = +layer;
            self._manageOffEvents(self.options.map, o);
          });
      }
    }
    return this;
  },

  setOptions: function (opts) {

    if (typeof opts != "object" || opts.length) {
      throw new Error(opts + ' options must be an object');
    }

    _.extend(this.options, opts);

    var opts = this.options;

    this.options.query = this.options.query || "select * from " + this.options.table_name;
    if(this.options.query_wrapper) {
      this.options.query = _.template(this.options.query_wrapper)({ sql: this.options.query });
    }

    this.setSilent(true);
    opts.interaction && this.setInteraction(opts.interaction);
    opts.opacity && this.setOpacity(opts.opacity);
    opts.query && this.setQuery(opts.query.replace(/\{\{table_name\}\}/g, this.options.table_name));
    opts.tile_style && this.setCartoCSS(opts.tile_style.replace(new RegExp( opts.table_name, "g"), "layer0"));
    opts.cartocss && this.setCartoCSS(opts.cartocss);
    opts.interactivity && this.setInteractivity(opts.interactivity);
    opts.visible ? this.show() : this.hide();
    this.setSilent(false);
    this._definitionUpdated();

  },

  _getLayerDefinition: function() {
    // set params
    var params = {};
    var opts = this.options;
    var sql, cartocss, cartocss_version;
    sql = opts.query || "select * from " + opts.table_name;

    if(opts.query_wrapper) {
      sql = _.template(opts.query_wrapper)({ sql: sql });
    }

    cartocss = opts.tile_style;
    cartocss_version = opts.cartocss_version || '2.1.0';

    // extra_params?
    for (var _param in opts.extra_params) {
      var v = opts.extra_params[_param]
      params[_param] = v.replace ? v.replace(/\{\{table_name\}\}/g, opts.table_name): v;
    }
    sql = sql.replace(/\{\{table_name\}\}/g, opts.table_name);
    cartocss = cartocss.replace(/\{\{table_name\}\}/g, opts.table_name);
    cartocss = cartocss.replace(new RegExp( opts.table_name, "g"), "layer0");


    return {
      sql: sql,
      cartocss: cartocss,
      cartocss_version: cartocss_version,
      params: params,
      interactivity: opts.interactivity
    }

  },

  error: function(e) {
    //console.log(e.error);
  },

  tilesOk: function() {
  },

  _clearInteraction: function() {
    for(var i in this.interactionEnabled) {
      if(this.interactionEnabled[i]) {
        this.setInteraction(i, false);
      }
    }
  },

  _reloadInteraction: function() {
    for(var i in this.interactionEnabled) {
      if(this.interactionEnabled[i]) {
        this.setInteraction(i, false);
        this.setInteraction(i, true);
      }
    }
  },

  /**
   *  Check the tiles
   */
  _checkTiles: function() {
    var xyz = {z: 4, x: 6, y: 6}
      , self = this
      , img = new Image()
      , urls = this._tileJSON()

    getTiles(function(urls) {

      var grid_url = urls.tiles[0]
          .replace(/\{z\}/g,xyz.z)
          .replace(/\{x\}/g,xyz.x)
          .replace(/\{y\}/g,xyz.y);

      this.options.ajax({
        method: "get",
        url: grid_url,
        crossDomain: true,
        success: function() {
          self.tilesOk();
          clearTimeout(timeout)
        },
        error: function(xhr, msg, data) {
          clearTimeout(timeout);
          self.error(xhr.responseText && JSON.parse(xhr.responseText));
        }
      });
    });

    var timeout = setTimeout(function(){
      clearTimeout(timeout);
      self.error("tile timeout");
    }, 30000);

  }
};




cdb.geo.common = {};

cdb.geo.common.CartoDBLogo = {

  /**
   * Check if any class already exists
   * in the provided container
   */
  isWadusAdded: function(container, className) {
    // Check if any cartodb-logo exists within container
    var a = [];
    var re = new RegExp('\\b' + className + '\\b');
    var els = container.getElementsByTagName("*");
    for(var i=0,j=els.length; i<j; i++)
      if(re.test(els[i].className))a.push(els[i]);

    return a.length > 0;
  },

  /**
   *  Check if browser supports retina images
   */
  isRetinaBrowser: function() {
    return  ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
            ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
            window.matchMedia('(min-resolution:144dpi)').matches);
  },

  /**
   * Add Cartodb logo
   * It needs a position, timeout if it is needed and the container where to add it
   */
  addWadus: function(position, timeout, container) {
    var self = this;
    setTimeout(function() {
      if (!self.isWadusAdded(container, 'cartodb-logo')) {
        var cartodb_link = document.createElement("div");
        var is_retina = self.isRetinaBrowser();
        cartodb_link.setAttribute('class','cartodb-logo');
        cartodb_link.setAttribute('style',"position:absolute; bottom:0; left:0; display:block; border:none; z-index:1000000;");
        var protocol = location.protocol.indexOf('https') === -1 ? 'http': 'https';
        var link = cdb.config.get('cartodb_logo_link');
        cartodb_link.innerHTML = "<a href='" + link + "' target='_blank'><img width='71' height='29' src='" + protocol + "://cartodb.s3.amazonaws.com/static/new_logo" + (is_retina ? '@2x' : '') + ".png' style='position:absolute; bottom:" + 
          ( position.bottom || 0 ) + "px; left:" + ( position.left || 0 ) + "px; display:block; width:71px!important; height:29px!important; border:none; outline:none;' alt='CartoDB' title='CartoDB' />";
        container.appendChild(cartodb_link);
      }
    },( timeout || 0 ));
  }
};
