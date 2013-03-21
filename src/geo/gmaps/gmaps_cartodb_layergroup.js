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

var CartoDBLayerGroup = function(opts) {

  var default_options = {
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
  };

  this.options = _.defaults(opts, default_options);
  this.tiles = 0;
  this.tilejson = null;
  this.interaction = [];
  this.interactionEnabled = [];
  
  if (!opts.layer_definition) {
    throw new Error('cartodb-gmaps needs at least the layer_definition');
  }

  // Add CartoDB logo
  this._addWadus({left: 74, bottom:8}, 2000, this.options.map.getDiv());

  wax.g.connector.call(this, opts);

  // lovely wax connector overwrites options so set them again
  // TODO: remove wax.connector here
   _.extend(this.options, opts);
  this.projector = new Projector(opts.map);
  LayerDefinition.call(this, opts.layer_definition, this.options);
  // precache
  this.getTiles();
};

CartoDBLayerGroup.Projector = Projector;

CartoDBLayerGroup.prototype = new wax.g.connector();
_.extend(CartoDBLayerGroup.prototype, CartoDBLayerCommon.prototype, LayerDefinition.prototype);

CartoDBLayerGroup.prototype.interactionClass = wax.g.interaction;

CartoDBLayerGroup.prototype.setOpacity = function(opacity) {
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

CartoDBLayerGroup.prototype.setAttribution = function() {};

CartoDBLayerGroup.prototype.getTile = function(coord, zoom, ownerDocument) {

  var self = this;

  if(!this.options.added) {
    this.onAdd();
  }

  this.options.added = true;

  if(this.tilejson == null) {
    var key = zoom + '/' + coord.x + '/' + coord.y;
    var i = this.cache[key] = new Image(256, 256);
    i.setAttribute('gTileKey', key);
    return i;
  }

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

CartoDBLayerGroup.prototype.onAdd = function () {
  this.update();
};

CartoDBLayerGroup.prototype.clear = function () {
  if (this.interaction) {
    this.interaction.remove();
    delete this.interaction;
  }
  self.finishLoading && self.finishLoading();
};

CartoDBLayerGroup.prototype.update = function (done) {
  var self = this;
  this.getTiles(function(urls) {
    if(urls) {
      self.tilejson = urls;
      self.options.tiles = urls.tiles;
      self.cache = {};
      self._reloadInteraction();
      self.refreshView();
      done && done();
    } else {
      //TODO: manage error
    }
  });
  // clear wax cache
  // set new tiles to wax
  //this._addInteraction();

  //this._checkTiles();

  // reload the tiles
};


CartoDBLayerGroup.prototype.refreshView = function() {
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
CartoDBLayerGroup.prototype.onLayerDefinitionUpdated = function() {
    this.update();
}


CartoDBLayerGroup.prototype.setOptions = function (opts) {
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

CartoDBLayerGroup.prototype._checkLayer = function() {
  if (!this.options.added) {
    throw new Error('the layer is not still added to the map');
  }
}

CartoDBLayerGroup.prototype._findPos = function (map,o) {
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

CartoDBLayerGroup.prototype._manageOffEvents = function(){
  if (this.options.featureOut) {
    return this.options.featureOut && this.options.featureOut();
  }
};


CartoDBLayerGroup.prototype._manageOnEvents = function(map,o) {
  var point  = this._findPos(map, o);
  var latlng = this.projector.pixelToLatLng(point);

  switch (o.e.type) {
    case 'mousemove':
      if (this.options.featureOver) {
        return this.options.featureOver(o.e,latlng, point, o.data, o.layer);
      }
      break;

    case 'click':
    case 'touchend':
      if (this.options.featureClick) {
        this.options.featureClick(o.e,latlng, point, o.data, o.layer);
      }
      break;
    default:
      break;
  }
}

cdb.geo.CartoDBLayerGroupGMaps = CartoDBLayerGroup;

/**
* gmaps cartodb layer
*/

})();
