(function() {
// if google maps is not defined do not load the class
if(typeof(google) == "undefined" || typeof(google.maps) == "undefined") {
  return;
}

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

var default_options = {
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
  extra_params:   {
  },
  cdn_url:        null,
  subdomains:     null
};

var OPACITY_FILTER = "progid:DXImageTransform.Microsoft.gradient(startColorstr=#00FFFFFF,endColorstr=#00FFFFFF)";

var CartoDBNamedMap = function(opts) {

  this.options = _.defaults(opts, default_options);
  this.tiles = 0;
  this.tilejson = null;
  this.interaction = [];

  if (!opts.named_map && !opts.sublayers) {
      throw new Error('cartodb-gmaps needs at least the named_map');
  }

  // Add CartoDB logo
  if (this.options.cartodb_logo != false)
    cdb.geo.common.CartoDBLogo.addWadus({ left: 74, bottom:8 }, 2000, this.options.map.getDiv());

  wax.g.connector.call(this, opts);

  // lovely wax connector overwrites options so set them again
  // TODO: remove wax.connector here
   _.extend(this.options, opts);
  this.projector = new Projector(opts.map);
  NamedMap.call(this, this.options.named_map, this.options);
  CartoDBLayerCommon.call(this);
  // precache
  this.update();
};


var CartoDBLayerGroup = function(opts) {

  this.options = _.defaults(opts, default_options);
  this.tiles = 0;
  this.tilejson = null;
  this.interaction = [];

  if (!opts.layer_definition && !opts.sublayers) {
      throw new Error('cartodb-leaflet needs at least the layer_definition or sublayer list');
  }

  // if only sublayers is available, generate layer_definition from it
  if(!opts.layer_definition) {
    opts.layer_definition = LayerDefinition.layerDefFromSubLayers(opts.sublayers);
  }

  // Add CartoDB logo
  if (this.options.cartodb_logo != false)
    cdb.geo.common.CartoDBLogo.addWadus({ left: 74, bottom:8 }, 2000, this.options.map.getDiv());

  wax.g.connector.call(this, opts);

  // lovely wax connector overwrites options so set them again
  // TODO: remove wax.connector here
   _.extend(this.options, opts);
  this.projector = new Projector(opts.map);
  LayerDefinition.call(this, opts.layer_definition, this.options);
  CartoDBLayerCommon.call(this);
  // precache
  this.update();
};

function setImageOpacityIE8(img, opacity) {
    var v = Math.round(opacity*100);
    if (v >= 99) {
      img.style.filter = OPACITY_FILTER;
    } else {
      img.style.filter = "alpha(opacity=" + (opacity) + ");";
    }
}

function CartoDBLayerGroupBase() {}

CartoDBLayerGroupBase.prototype.setOpacity = function(opacity) {
  if (isNaN(opacity) || opacity > 1 || opacity < 0) {
    throw new Error(opacity + ' is not a valid value, should be in [0, 1] range');
  }
  this.opacity = this.options.opacity = opacity;
  for(var key in this.cache) {
    var img = this.cache[key];
    img.style.opacity = opacity;
    setImageOpacityIE8(img, opacity);
  }

};

CartoDBLayerGroupBase.prototype.setAttribution = function() {};

CartoDBLayerGroupBase.prototype.getTile = function(coord, zoom, ownerDocument) {
  var EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  var self = this;
  var ie = 'ActiveXObject' in window,
      ielt9 = ie && !document.addEventListener;

  this.options.added = true;

  if(this.tilejson === null) {
    var key = zoom + '/' + coord.x + '/' + coord.y;
    var i = this.cache[key] = new Image(256, 256);
    i.src = EMPTY_GIF;
    i.setAttribute('gTileKey', key);
    i.style.opacity = this.options.opacity;
    return i;
  }

  var im = wax.g.connector.prototype.getTile.call(this, coord, zoom, ownerDocument);

  // in IE8 semi transparency does not work and needs filter
  if( ielt9 ) {
    setImageOpacityIE8(im, this.options.opacity);
  }
  im.style.opacity = this.options.opacity;
  if (this.tiles === 0) {
    this.loading && this.loading();
  }

  this.tiles++;

  var loadTime = cartodb.core.Profiler.metric('cartodb-js.tile.png.load.time').start();

  var finished = function() {
    loadTime.end();
    self.tiles--;
    if (self.tiles === 0) {
      self.finishLoading && self.finishLoading();
    }
  };
  im.onload = finished;
  im.onerror = function() {
    cartodb.core.Profiler.metric('cartodb-js.tile.png.error').inc();
    finished();
  }


  return im;
};

CartoDBLayerGroupBase.prototype.onAdd = function () {
  //this.update();
};

CartoDBLayerGroupBase.prototype.clear = function () {
  this._clearInteraction();
  self.finishLoading && self.finishLoading();
};

CartoDBLayerGroupBase.prototype.update = function (done) {
  var self = this;
  this.loading && this.loading();
  this.getTiles(function(urls, err) {
    if(urls) {
      self.tilejson = urls;
      self.options.tiles = urls.tiles;
      self.tiles = 0;
      self.cache = {};
      self._reloadInteraction();
      self.refreshView();
      self.ok && self.ok();
      done && done();
    } else {
      self.error && self.error(err)
    }
  });
};


CartoDBLayerGroupBase.prototype.refreshView = function() {
  var self = this;
  var map = this.options.map;
  map.overlayMapTypes.forEach(
    function(layer, i) {
      if (layer == self) {
        map.overlayMapTypes.setAt(i, self);
        return;
      }
    }
  );
}
CartoDBLayerGroupBase.prototype.onLayerDefinitionUpdated = function() {
    this.update();
}

CartoDBLayerGroupBase.prototype._checkLayer = function() {
  if (!this.options.added) {
    throw new Error('the layer is not still added to the map');
  }
}

CartoDBLayerGroupBase.prototype._findPos = function (map,o) {
  var curleft, cartop;
  curleft = curtop = 0;
  var obj = map.getDiv();

  var x, y;
  if (o.e.changedTouches && o.e.changedTouches.length > 0) {
    x = o.e.changedTouches[0].clientX + window.scrollX;
    y = o.e.changedTouches[0].clientY + window.scrollY;
  } else {
    x = o.e.clientX;
    y = o.e.clientY;
  }

  do {
    curleft += obj.offsetLeft;
    curtop += obj.offsetTop;
  } while (obj = obj.offsetParent);
  return new google.maps.Point(
      x - curleft,
      y - curtop
  );
};

CartoDBLayerGroupBase.prototype._manageOffEvents = function(map, o){
  if (this.options.featureOut) {
    return this.options.featureOut && this.options.featureOut(o.e, o.layer);
  }
};


CartoDBLayerGroupBase.prototype._manageOnEvents = function(map,o) {
  var point  = this._findPos(map, o);
  var latlng = this.projector.pixelToLatLng(point);
  var event_type = o.e.type.toLowerCase();


  switch (event_type) {
    case 'mousemove':
      if (this.options.featureOver) {
        return this.options.featureOver(o.e,latlng, point, o.data, o.layer);
      }
      break;

    case 'click':
    case 'touchend':
    case 'mspointerup':
      if (this.options.featureClick) {
        this.options.featureClick(o.e,latlng, point, o.data, o.layer);
      }
      break;
    default:
      break;
  }
}

// CartoDBLayerGroup type
CartoDBLayerGroup.Projector = Projector;
CartoDBLayerGroup.prototype = new wax.g.connector();
_.extend(CartoDBLayerGroup.prototype, LayerDefinition.prototype, CartoDBLayerGroupBase.prototype, CartoDBLayerCommon.prototype);
CartoDBLayerGroup.prototype.interactionClass = wax.g.interaction;


// CartoDBNamedMap
CartoDBNamedMap.prototype = new wax.g.connector();
_.extend(CartoDBNamedMap.prototype, NamedMap.prototype, CartoDBLayerGroupBase.prototype, CartoDBLayerCommon.prototype);
CartoDBNamedMap.prototype.interactionClass = wax.g.interaction;


// export
cdb.geo.CartoDBLayerGroupGMaps = CartoDBLayerGroup;
cdb.geo.CartoDBNamedMapGMaps = CartoDBNamedMap;

/*
 *
 *  cartodb layer group view
 *
 */

function LayerGroupView(base) {
  var GMapsCartoDBLayerGroupView = function(layerModel, gmapsMap) {
    var self = this;
    var hovers = [];

    _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

    // CartoDB new attribution,z
    // also we have the logo
    layerModel.attributes.attribution = cdb.config.get('cartodb_attributions');

    var opts = _.clone(layerModel.attributes);

    opts.map =  gmapsMap;

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
      self.featureOver  && self.featureOver.apply(this, arguments);

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
      self.featureOut  && self.featureOut.apply(this, arguments);
    };

    opts.featureClick  = _.debounce(function() {
      _featureClick  && _featureClick.apply(this, arguments);
      self.featureClick  && self.featureClick.apply(opts, arguments);
    }, 10);

    
    //CartoDBLayerGroup.call(this, opts);
    base.call(this, opts);
    cdb.geo.GMapsLayerView.call(this, layerModel, this, gmapsMap);
  };



  _.extend(
    GMapsCartoDBLayerGroupView.prototype,
    cdb.geo.GMapsLayerView.prototype,
    base.prototype,
    {

    _update: function() {
      this.setOptions(this.model.attributes);
    },

    reload: function() {
      this.model.invalidate();
    },

    remove: function() {
      cdb.geo.GMapsLayerView.prototype.remove.call(this);
      this.clear();
    },

    featureOver: function(e, latlon, pixelPos, data, layer) {
      // dont pass gmaps LatLng
      this.trigger('featureOver', e, [latlon.lat(), latlon.lng()], pixelPos, data, layer);
    },

    featureOut: function(e, layer) {
      this.trigger('featureOut', e, layer);
    },

    featureClick: function(e, latlon, pixelPos, data, layer) {
      // dont pass leaflet lat/lon
      this.trigger('featureClick', e, [latlon.lat(), latlon.lng()], pixelPos, data, layer);
    },

    error: function(e) {
      if(this.model) {
        //trigger the error form _checkTiles in the model
        this.model.trigger('error', e?e.errors:'unknown error');
        this.model.trigger('tileError', e?e.errors:'unknown error');
      }
    },

    ok: function(e) {
      this.model.trigger('tileOk');
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
  return GMapsCartoDBLayerGroupView;
}

cdb.geo.GMapsCartoDBLayerGroupView = LayerGroupView(CartoDBLayerGroup);
cdb.geo.GMapsCartoDBNamedMapView = LayerGroupView(CartoDBNamedMap);

cdb.geo.CartoDBNamedMapGMaps = CartoDBNamedMap;
/**
* gmaps cartodb layer
*/

})();
