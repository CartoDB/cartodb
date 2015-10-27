var _ = require('underscore');
var Backbone = require('backbone');
var L = require('leaflet-proxy').get();
var LeafletLayerView = require('./leaflet-layer-view');
var LeafletCartoDBLayer = require('./leaflet-cartodb-layer');

/**
 * leatlet cartodb layer
 */
var LeafletLayerCartoDBView = LeafletCartoDBLayer.extend({
  initialize: function(layerModel, leafletMap) {
    var self = this;

    _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

    var opts = _.clone(layerModel.attributes);

    opts.map =  leafletMap;

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

    layerModel.bind('change:visible', function() {
      self.model.get('visible') ? self.show(): self.hide();
    }, this);

    LeafletCartoDBLayer.prototype.initialize.call(this, opts);
    LeafletLayerView.call(this, layerModel, this, leafletMap);

  },

  _modelUpdated: function() {
    var attrs = _.clone(this.model.attributes);
    this.leafletLayer.setOptions(attrs);
  },

  featureOver: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureOver', e, [latlon.lat, latlon.lng], pixelPos, data, 0);
  },

  featureOut: function(e) {
    this.trigger('featureOut', e, 0);
  },

  featureClick: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureClick', e, [latlon.lat, latlon.lng], pixelPos, data, 0);
  },

  reload: function() {
    this.model.invalidate();
  },

  error: function(e) {
    this.trigger('error', e?e.error:'unknown error');
    this.model.trigger('tileError', e?e.error:'unknown error');
  },

  tilesOk: function(e) {
    this.model.trigger('tileOk');
  },

  includes: [
    LeafletLayerView.prototype,
    Backbone.Events
  ]

});

module.exports = LeafletLayerCartoDBView;
