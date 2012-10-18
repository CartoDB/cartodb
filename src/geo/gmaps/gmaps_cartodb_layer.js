
(function() {
// if google maps is not defined do not load the class
if(typeof(google) == "undefined" || typeof(google.maps) == "undefined") 
  return;

// helper to get pixel position from latlon
var Projector = function(map) { this.setMap(map); };
Projector.prototype = new google.maps.OverlayView(); 
Projector.prototype.draw = function() {};
Projector.prototype.latLngToPixel = function(point) {
  var p = this.getProjection();
  if(p) {
    return p.fromLatLngToContainerPixel(point);
  }
  return [0, 0];
};
Projector.prototype.pixelToLatLng = function(point) {
  var p = this.getProjection();
  if(p) {
    return p.fromContainerPixelToLatLng(point);
  }
  return [0, 0];
  //return this.map.getProjection().fromPointToLatLng(point);
};

var CartoDBLayer = function(opts) {

   var default_options = {
        query:          "SELECT * FROM {{table_name}}",
        opacity:        1,
        auto_bound:     false,
        debug:          false,
        visible:        true,
        added:          false,
        loaded:         null,
        loading:        null, 
        layer_order:    "top",
        tiler_domain:   "cartodb.com",
        tiler_port:     "80",
        tiler_protocol: "http",
        sql_domain:     "cartodb.com",
        sql_port:       "80",
        sql_protocol:   "http"
  };

  this.opts = _.defaults(opts, default_options);
  opts.tiles = [
    this._tilesUrl()
  ];
  wax.g.connector.call(this, opts);
  this.projector = new Projector(opts.map);
  this.addInteraction();
};

CartoDBLayer.Projector = Projector;

CartoDBLayer.prototype = new wax.g.connector();

CartoDBLayer.prototype.setOpacity = function(opacity) {

  if (isNaN(opacity) || opacity > 1 || opacity < 0) {
    throw(opacity + ' is not a valid value, should be in [0, 1] range');
  }
  this.opacity = this.opts.opacity = opacity;
  for(var key in this.cache) {
    var img = this.cache[key];
    img.setAttribute("style","opacity: " + opacity + "; filter: alpha(opacity="+(opacity*100)+");");
  }

};

CartoDBLayer.prototype.addInteraction = function () {
  var self = this;
  // add interaction
  if(this._interaction) { 
    return;
  }
  this._interaction = wax.g.interaction()
    .map(this.opts.map)
    .tilejson(this._tileJSON());
  this.setInteraction(true);
};

CartoDBLayer.prototype.clear = function () {
  if (this._interaction) {
    this._interaction.remove();
  }
};

CartoDBLayer.prototype.update = function () {
  var tilejson = this._tileJSON();
  this.opts.tiles = tilejson.tiles;
  this.cache = {};
  this._interaction.tilejson(tilejson);
};

/**
 * Hide the CartoDB layer
 */
CartoDBLayer.prototype.hide = function() {

  if (!this.opts.visible) {
    return;
  }

  this.opts.visible = false;
  // Save previous opacity
  this.opts.previous_opacity = this.opts.opacity;
  // Hide it!
  this.setOpacity(0);
  this.setInteraction(false);
  google.maps.event.trigger(this, 'hidden');
};


/**
 * Show the CartoDB layer
 */
CartoDBLayer.prototype.show = function() {

  if (this.opts.visible) {
    return;
  }
  this.opts.visible = true;
  this.setOpacity(this.opts.previous_opacity);
  delete this.opts.previous_opacity;
  this.setInteraction(true);
  google.maps.event.trigger(this, 'shown');
};

/**
 * Active or desactive interaction
 * @params {Boolean} Choose if wants interaction or not
 */
CartoDBLayer.prototype.setInteraction = function(enable) {
  var self = this;

  if (enable !== false && enable !== true) {
      throw(enable + ' should be a enableean');
  }

  if (this._interaction) {
    if (enable) {
      this._interaction
        .on('on',function(o) { 
          self._manageOnEvents(self.opts.map, o); 
        })
        .on('off', function(o) { 
          self._manageOffEvents(); 
        });
    } else {
      this._interaction.off('on');
      this._interaction.off('off');
    }
  }
};


CartoDBLayer.prototype.setOptions = function (opts) {
  _.extend(this.opts, opts);
  if(this.opts.interactivity) {
    var i = this.opts.interactivity
    this.opts.interactivity = i.join ? i.join(','): i;
  }
  this.update();
}

CartoDBLayer.prototype._checkLayer = function() {
  if (!this.opts.added) {
    throw new Exception('the layer is not still added to the map');
  }
}
/**
 * Change query of the tiles
 * @params {str} New sql for the tiles
 * @params {Boolean}  Choose if the map fits to the sql results bounds (thanks to @fgblanch)
*/
CartoDBLayer.prototype.setQuery = function(sql) {

  this._checkLayer();

  if (!sql) {
    throw new Exception('sql is not a valid query');
  }

  /*if (fitToBounds)
    this.setBounds(sql)
    */

  // Set the new value to the layer options
  this.opts.query = sql;
  this._update();
}

CartoDBLayer.prototype.isVisible = function() {
  return this.opts.visible;
}

CartoDBLayer.prototype.setCartoCSS = function(style, version) {

  this._checkLayer();

  if (!style) {
    throw new Exception('should specify a valid style');
  }

  // Set the new value to the layer options
  this.opts.tile_style = style;
  this._update();
}


/**
 * Change the query when clicks in a feature
 * @params { Boolean || String } New sql for the request
 */
CartoDBLayer.prototype.setInteractivity = function(fieldsArray) {

  this._checkLayer();

  if (!fieldsArray) {
    throw new Exception('should specify fieldsArray');
  }

  // Set the new value to the layer options
  this.opts.interactivity = fieldsArray.join ? fieldsArray.join(','): fieldsArray;
  // Update tiles
  this._update();
}


CartoDBLayer.prototype._tileJSON = function () {
    return {
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: [this._tilesUrl('grid.json')],
        tiles: [this._tilesUrl()],
        formatter: function(options, data) { return data; }
    };
};

CartoDBLayer.prototype._findPos = function (map,o) {
      var curleft, cartop;
      curleft = curtop = 0;
      var obj = map.getDiv();
      // Modern browsers
      if (obj.offsetParent) {
        do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return new google.maps.Point(
            (o.e.clientX || o.e.changedTouches[0].clientX) - curleft,
            (o.e.clientY || o.e.changedTouches[0].clientY) - curtop
        );
      } else {
        // IE
        return new google.maps.Point(o.e);
      }
};

CartoDBLayer.prototype._manageOffEvents = function(){
  if (this.opts.featureOut) {
    return this.opts.featureOut && this.opts.featureOut();
  } 
};


CartoDBLayer.prototype._manageOnEvents = function(map,o) {
      var point = this._findPos(map, o)
      , latlng = this.projector.pixelToLatLng(point);

      switch (o.e.type) {
        case 'mousemove': 
          if (this.opts.featureOver) {
            return this.opts.featureOver(o.e,latlng, point, o.data);
          } 
          break;
        case 'click':   
          if (this.opts.featureClick) {
            this.opts.featureClick(o.e,latlng, point, o.data);
          } 
          break;
        case 'touchend':  
          if (this.opts.featureClick) {
            this.opts.featureClick(o.e,latlng, point, o.data);
          }
          break;
        default: 
          break;
      }
    }


CartoDBLayer.prototype._host = function() {
   return this.opts.tiler_protocol +
       "://" + ((this.opts.user_name)?this.opts.user_name+".":"")  +
       this.opts.tiler_domain +
       ((this.opts.tiler_port != "") ? (":" + this.opts.tiler_port) : "");
};

CartoDBLayer.prototype._tilesUrl = function(ext) {
    ext = ext || 'png';
    var cartodb_url = this._host() + '/tiles/' + this.opts.table_name + '/{z}/{x}/{y}.' + ext + '?';

      // set params
      var params = {};
      if(this.opts.query) {
        params.sql = this.opts.query;
      }
      if(this.opts.tile_style) {
        params.style = this.opts.tile_style;
      }
      if(ext === 'grid.json') {
        if(this.opts.interactivity) {
          params.interactivity = this.opts.interactivity.replace(/ /g, '');
        }
      }
      var url_params = [];
      for(var k in params) {
        var q = encodeURIComponent(
          params[k].replace(/\{\{table_name\}\}/g, this.opts.table_name)
        );
        q = q.replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");
        url_params.push(k + "=" + q);
      }
      cartodb_url += url_params.join('&');

      // extra_params?
      for (_param in this.opts.extra_params) {
         cartodb_url += "&"+_param+"="+this.opts.extra_params[_param];
      }
      return cartodb_url;
}


cdb.geo.CartoDBLayerGMaps = CartoDBLayer;

/**
* gmaps cartodb layer
*/

var GMapsCartoDBLayerView = function(layerModel, gmapsMap) {
  var self = this;

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

  var opts = _.clone(layerModel.attributes);

  opts.map =  gmapsMap;

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

  cdb.geo.CartoDBLayerGMaps.call(this, opts);
  cdb.geo.GMapsLayerView.call(this, layerModel, this, gmapsMap);
};

cdb.geo.GMapsCartoDBLayerView = GMapsCartoDBLayerView;

_.extend(
  GMapsCartoDBLayerView.prototype, 
  cdb.geo.GMapsLayerView.prototype, 
  cdb.geo.CartoDBLayerGMaps.prototype,
  {

  _update: function() {
    _.extend(this.gmapsLayer.opts, this.model.attributes);
    this.gmapsLayer.update();
    this.refreshView();
  },

  remove: function() {
    cdb.geo.GMapsLayerView.prototype.remove.call(this);
    this.clear();
  },

  featureOver: function(e, latlon, pixelPos, data) {
    // dont pass gmaps LatLng
    this.trigger('featureOver', e, [latlon.lat(), latlon.lng()], pixelPos, data);
  },

  featureOut: function(e) {
    this.trigger('featureOut', e);
  },

  featureClick: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureClick', e, [latlon.lat(), latlon.lng()], pixelPos, data);
  }

});

})();
