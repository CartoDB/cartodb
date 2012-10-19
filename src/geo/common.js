
/*
 *  common functions for cartodb connector
 */

function CartoDBLayerCommon() {}

CartoDBLayerCommon.prototype = {

  // the way to show/hidelayer is to set opacity
  // removing the interactivty at the same time
  show: function() {
    if (this.options.visible) {
      return;
    }
    this.options.visible = true;
    this.setOpacity(this.options.previous_opacity);
    delete this.options.previous_opacity;
    this.setInteraction(true);

  },

  hide: function() {
    if (!this.options.visible) {
      return;
    }
    this.options.previous_opacity = this.options.opacity;
    this.setOpacity(0);
    this.setInteraction(false);

    this.options.visible = false;
  },


  _host: function() {
    var opts = this.options;
    return opts.tiler_protocol +
       "://" + ((opts.user_name) ? opts.user_name+".":"")  +
       opts.tiler_domain +
       ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
  },

  //
  // param ext tile extension, i.e png, json
  // 
  _tilesUrl: function(ext) {
    var opts = this.options;
    ext = ext || 'png';
    var cartodb_url = this._host() + '/tiles/' + opts.table_name + '/{z}/{x}/{y}.' + ext + '?';

    // set params
    var params = {};
    if(opts.query) {
      params.sql = opts.query;
    }
    if(opts.tile_style) {
      params.style = opts.tile_style;
    }
    if(opts.style_version) {
      params.style_version = opts.style_version;
    }
    if(ext === 'grid.json') {
      if(opts.interactivity) {
        params.interactivity = opts.interactivity.replace(/ /g, '');
      }
    }
    var url_params = [];
    for(var k in params) {
      var q = encodeURIComponent(
        params[k].replace(/\{\{table_name\}\}/g, opts.table_name)
      );
      q = q.replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");
      url_params.push(k + "=" + q);
    }
    cartodb_url += url_params.join('&');

    // extra_params?
    for (_param in opts.extra_params) {
       cartodb_url += "&" + _param + "=" + opts.extra_params[_param];
    }
    return cartodb_url;
  },

  _tileJSON: function () {
    return {
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: [this._tilesUrl('grid.json')],
        tiles: [this._tilesUrl()],
        formatter: function(options, data) { return data; }
    };
  },

  /**
   *  Check the tiles
   */
  _checkTiles: function() {
    var xyz = {z: 4, x: 6, y: 6}
      , self = this
      , img = new Image()
      , urls = this._tileJSON()

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

};

