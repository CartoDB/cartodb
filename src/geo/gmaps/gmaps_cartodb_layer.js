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

var CartoDBLayer = function(options) {

  var default_options = {
    query:          "SELECT * FROM {{table_name}}",
    opacity:        0.99,
    attribution:    "CartoDB",
    opacity:        1,
    debug:          false,
    visible:        true,
    added:          false,
    extra_params:   {},
    layer_definition_version: '1.0.0'
  };

  this.options = _.defaults(options, default_options);

  if (!options.table_name || !options.user_name || !options.tile_style) {
      throw ('cartodb-gmaps needs at least a CartoDB table name, user_name and tile_style');
  }


  this.options.layer_definition = {
    version: this.options.layer_definition_version,
    layers: [{
      type: 'cartodb',
      options: this._getLayerDefinition(),
      infowindow: this.options.infowindow
    }]
  };
  cdb.geo.CartoDBLayerGroupGMaps.call(this, this.options);

  this.setOptions(this.options);

};

_.extend(CartoDBLayer.prototype, cdb.geo.CartoDBLayerGroupGMaps.prototype);

CartoDBLayer.prototype.setQuery = function (layer, sql) {
  if(sql === undefined) {
    sql = layer;
    layer = 0;
  }
  sql = sql || 'select * from ' + this.options.table_name;
  LayerDefinition.prototype.setQuery.call(this, layer, sql);
};

cdb.geo.CartoDBLayerGMaps = CartoDBLayer;

/**
* gmaps cartodb layer
*/

var GMapsCartoDBLayerView = function(layerModel, gmapsMap) {
  var self = this;

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

  // CartoDB new attribution,
  // also we have the logo
  layerModel.attributes.attribution = cdb.config.get('cartodb_attributions');

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
    this.setOptions(this.model.attributes);
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
    this.trigger('featureOver', e, [latlon.lat(), latlon.lng()], pixelPos, data, 0);
  },

  featureOut: function(e) {
    this.trigger('featureOut', e);
  },

  featureClick: function(e, latlon, pixelPos, data, layer) {
    // dont pass leaflet lat/lon
    this.trigger('featureClick', e, [latlon.lat(), latlon.lng()], pixelPos, data, 0);
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
