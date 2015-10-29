var google = require('google-proxy').get();;
var wax = require('wax.cartodb.js');
var Profiler = require('cdb.core.Profiler');

var OPACITY_FILTER = "progid:DXImageTransform.Microsoft.gradient(startColorstr=#00FFFFFF,endColorstr=#00FFFFFF)";

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

  var loadTime = Profiler.metric('cartodb-js.tile.png.load.time').start();

  var finished = function() {
    loadTime.end();
    self.tiles--;
    if (self.tiles === 0) {
      self.finishLoading && self.finishLoading();
    }
  };
  im.onload = finished;
  im.onerror = function() {
    Profiler.metric('cartodb-js.tile.png.error').inc();
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
  var curleft = 0;
  var curtop = 0;
  var obj = map.getDiv();

  var x, y;
  if (o.e.changedTouches && o.e.changedTouches.length > 0) {
    x = o.e.changedTouches[0].clientX + window.scrollX;
    y = o.e.changedTouches[0].clientY + window.scrollY;
  } else {
    x = o.e.clientX;
    y = o.e.clientY;
  }

  // If the map is fixed at the top of the window, we can't use offsetParent
  // cause there might be some scrolling that we need to take into account.
  if (obj.offsetParent && obj.offsetTop > 0) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    var point = this._newPoint(
      x - curleft, y - curtop);
  } else {
    var rect = obj.getBoundingClientRect();
    var scrollX = (window.scrollX || window.pageXOffset);
    var scrollY = (window.scrollY || window.pageYOffset);
    var point = this._newPoint(
      (o.e.clientX? o.e.clientX: x) - rect.left - obj.clientLeft - scrollX,
      (o.e.clientY? o.e.clientY: y) - rect.top - obj.clientTop - scrollY);
  }
  return point;
};

/**
 * Creates an instance of a google.maps Point
 */
CartoDBLayerGroupBase.prototype._newPoint = function(x, y) {
  return new google.maps.Point(x, y);
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
    case 'touchmove': // for some reason android browser does not send touchend
    case 'mspointerup':
    case 'pointerup':
    case 'pointermove':
      if (this.options.featureClick) {
        this.options.featureClick(o.e,latlng, point, o.data, o.layer);
      }
      break;
    default:
      break;
  }
}

module.exports = CartoDBLayerGroupBase;
