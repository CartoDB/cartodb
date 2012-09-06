
(function() {
// if google maps is not defined do not load the class
if(typeof(google) != "undefined" && typeof(google.maps) != "undefined") {

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
  this.opts = opts;
  opts.tiles = [
    this._tilesUrl()
  ];
  wax.g.connector.call(this, opts);
  this.projector = new Projector(opts.map);
  this.addInteraction();
};

CartoDBLayer.Projector = Projector;

CartoDBLayer.prototype = new wax.g.connector();

CartoDBLayer.prototype.addInteraction = function () {
  var self = this;
  // add interaction
  if(this._interaction) return;
  this._interaction = wax.g.interaction()
    .map(this.opts.map)
    .tilejson(this._tileJSON())
    .on('on',function(o) { 
      self._manageOnEvents(self.opts.map, o); 
    })
    .on('off', function(o) { 
      self._manageOffEvents(); 
    });
};

CartoDBLayer.prototype.remove = function () {
  if (self._interaction) {
    this._interaction.remove();
  }
};

CartoDBLayer.prototype.update = function () {
    var tilejson = this._tileJSON();
    this.options.tiles = tilejson.tiles;
    this.cache = {};
    this._interaction.tilejson(tilejson);
};

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
            return this.opts.featureOver(o.e,latlng,o.pos,o.data);
          } 
          break;
        case 'click':   
          if (this.opts.featureClick) {
            this.opts.featureClick(o.e,latlng,o.pos,o.data);
          } 
          break;
        case 'touchend':  
          if (this.opts.featureClick) {
            this.opts.featureClick(o.e,latlng,o.pos,o.data);
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

} //end defined google

cdb.geo.CartoDBLayerGMaps = CartoDBLayer;

})();
