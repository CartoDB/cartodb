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
    attribution:    "CartoDB",
    opacity:        1,
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
    sql_protocol:   "http",
    subdomains:      null
  };

  this.options = _.defaults(opts, default_options);
  opts.tiles = this._tileJSON().tiles;

  // Set init
  this.tiles = 0;

  // Add CartoDB logo
  this._addWadus({left: 74, bottom:8}, 2000, this.options.map.getDiv());

  wax.g.connector.call(this, opts);

  // lovely wax connector overwrites options so set them again
  // TODO: remove wax.connector here
   _.extend(this.options, opts);
  this.projector = new Projector(opts.map);
  this._addInteraction();
  this._checkTiles();
};

CartoDBLayer.Projector = Projector;

CartoDBLayer.prototype = new wax.g.connector();
_.extend(CartoDBLayer.prototype, CartoDBLayerCommon.prototype);


CartoDBLayer.prototype.setOpacity = function(opacity) {

  this._checkLayer();

  if (isNaN(opacity) || opacity > 1 || opacity < 0) {
    throw new Error(opacity + ' is not a valid value, should be in [0, 1] range');
  }
  this.opacity = this.options.opacity = opacity;
  for(var key in this.cache) {
    var img = this.cache[key];
    img.style.opacity = opacity;
    img.style.filter = "alpha(opacity=" + (opacity*100) + ");"

    //img.setAttribute("style","opacity: " + opacity + "; filter: alpha(opacity="+(opacity*100)+");");
  }

};

CartoDBLayer.prototype.setAttribution = function() {};

CartoDBLayer.prototype.getTile = function(coord, zoom, ownerDocument) {

  var self = this;

  this.options.added = true;

  var im = wax.g.connector.prototype.getTile.call(this, coord, zoom, ownerDocument);

  if (this.tiles == 0) {
    this.loading && this.loading();
    //this.trigger("loading");
  }

  this.tiles++;


  im.onload = im.onerror = function() {
    self.tiles--;
    if (self.tiles == 0) {
      self.finishLoading && self.finishLoading();
    }
  }

  return im;
}

CartoDBLayer.prototype._addInteraction = function () {
  var self = this;
  // add interaction
  if(this.interaction) {
    this.interaction.remove();
    this.interaction = null;
  }

  if(this.options.interaction) {
    this.interaction = wax.g.interaction()
      .map(this.options.map)
      .tilejson(this._tileJSON())
      .on('on',function(o) {
        self._manageOnEvents(self.options.map, o);
      })
      .on('off', function(o) {
        self._manageOffEvents();
      });
  }
};

CartoDBLayer.prototype.clear = function () {
  if (this.interaction) {
    this.interaction.remove();
    delete this.interaction;
  }
  self.finishLoading && self.finishLoading();
};

CartoDBLayer.prototype.update = function () {
  var tilejson = this._tileJSON();
  // clear wax cache
  this.cache = {};
  // set new tiles to wax
  this.options.tiles = tilejson.tiles;
  this._addInteraction();

  this._checkTiles();

  // reload the tiles
  this.refreshView();
};


CartoDBLayer.prototype.refreshView = function() {
}

/**
 * Active or desactive interaction
 * @params {Boolean} Choose if wants interaction or not
 */
CartoDBLayer.prototype.setInteraction = function(enable) {
  this.setOptions({
    interaction: enable
  });

};


CartoDBLayer.prototype.setOptions = function (opts) {
  _.extend(this.options, opts);

  if (typeof opts != "object" || opts.length) {
    throw new Error(opts + ' options has to be an object');
  }

  if(opts.interactivity) {
    var i = opts.interactivity;
    this.options.interactivity = i.join ? i.join(','): i;
  }
  if(opts.opacity !== undefined) {
    this.setOpacity(this.options.opacity);
  }

  // Update tiles
  if(opts.query != undefined || opts.style != undefined || opts.tile_style != undefined || opts.interactivity != undefined || opts.interaction != undefined) {
    this.update();
  }
}

CartoDBLayer.prototype._checkLayer = function() {
  if (!this.options.added) {
    throw new Error('the layer is not still added to the map');
  }
}
/**
 * Change query of the tiles
 * @params {str} New sql for the tiles
 * @params {Boolean}  Choose if the map fits to the sql results bounds (thanks to @fgblanch)
*/
CartoDBLayer.prototype.setQuery = function(sql) {

  this._checkLayer();

  /*if (fitToBounds)
    this.setBounds(sql)
    */

  // Set the new value to the layer options
  this.options.query = sql;
  this.update();
}

CartoDBLayer.prototype.isVisible = function() {
  return this.options.visible;
}

CartoDBLayer.prototype.setCartoCSS = function(style, version) {

  this._checkLayer();

  version = version || cdb.CARTOCSS_DEFAULT_VERSION;

  this.setOptions({
    tile_style: style,
    style_version: version
  });
}


/**
 * Change the query when clicks in a feature
 * @params { Boolean || String } New sql for the request
 */
CartoDBLayer.prototype.setInteractivity = function(fieldsArray) {

  this._checkLayer();

  if (!fieldsArray) {
    throw new Error('should specify fieldsArray');
  }

  // Set the new value to the layer options
  this.options.interactivity = fieldsArray.join ? fieldsArray.join(','): fieldsArray;
  // Update tiles
  this.update();
}



CartoDBLayer.prototype._findPos = function (map,o) {
  var curleft, cartop;
  curleft = curtop = 0;
  var obj = map.getDiv();
  do {
    curleft += obj.offsetLeft;
    curtop += obj.offsetTop;
  } while (obj = obj.offsetParent);
  return new google.maps.Point(
      (o.e.clientX || o.e.changedTouches[0].clientX) - curleft,
      (o.e.clientY || o.e.changedTouches[0].clientY) - curtop
  );
};

CartoDBLayer.prototype._manageOffEvents = function(){
  if (this.options.featureOut) {
    return this.options.featureOut && this.options.featureOut();
  }
};


CartoDBLayer.prototype._manageOnEvents = function(map,o) {
  var point = this._findPos(map, o)
    , latlng = this.projector.pixelToLatLng(point)
    , event_type = o.e.type.toLowerCase();

  switch (event_type) {
    case 'mousemove':
      if (this.options.featureOver) {
        return this.options.featureOver(o.e,latlng, point, o.data);
      }
      break;

    case 'click':
    case 'touchend':
    case 'mspointerup':
      if (this.options.featureClick) {
        this.options.featureClick(o.e,latlng, point, o.data);
      }
      break;
    default:
      break;
  }
}



cdb.geo.CartoDBLayerGMaps = CartoDBLayer;

/**
* gmaps cartodb layer
*/

var GMapsCartoDBLayerView = function(layerModel, gmapsMap) {
  var self = this;

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

  // CartoDB new attribution,
  // also we have the logo
  layerModel.attributes.attribution = "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>";

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
  cdb.geo.CartoDBLayerGMaps.prototype,
  cdb.geo.GMapsLayerView.prototype,
  {

  _update: function() {
    _.extend(this.options, this.model.attributes);

    this.update();

  },

  reload: function() {
    this.model.invalidate();
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
  },

  error: function(e) {
    if(this.model) {
      //trigger the error form _checkTiles in the model
      this.model.trigger('error', e?e.error:'unknown error');
      this.model.trigger('tileError', e?e.error:'unknown error');
    }
  },

  tilesOk: function(e) {
    this.model.trigger('tileOk');
  },

  loading: function() {
    this.trigger("loading");
  },

  finishLoading: function() {
    this.trigger("load");
  }


});

})();
