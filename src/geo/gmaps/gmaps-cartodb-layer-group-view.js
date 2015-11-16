var _ = require('underscore');
var GMapsLayerView = require('./gmaps-layer-view');
var CartoDBLayerGroupGmaps = require('./cartodb-layer-group-gmaps');

var GMapsCartoDBLayerGroupView = function(layerModel, gmapsMap) {
  var self = this;
  var hovers = [];

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

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


  this.model = layerModel;

  CartoDBLayerGroupGmaps.call(this, opts);
  GMapsLayerView.call(this, layerModel, this, gmapsMap);
};

_.extend(
  GMapsCartoDBLayerGroupView.prototype,
  GMapsLayerView.prototype,
  CartoDBLayerGroupGmaps.prototype,
  {

  reload: function() {
    this.model.invalidate();
  },

  remove: function() {
    GMapsLayerView.prototype.remove.call(this);
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

module.exports = GMapsCartoDBLayerGroupView;