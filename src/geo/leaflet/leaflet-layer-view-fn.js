var _ = require('underscore');
var Backbone = require('backbone');
var LeafletLayerView = require('./leaflet-layer-view');

var layerView = function layerView(base) {
  var layerViewClass = base.extend({

    includes: [
      LeafletLayerView.prototype,
      Backbone.Events
    ],

    initialize: function(layerModel, leafletMap) {
      var self = this;
      var hovers = [];

      var opts = _.clone(layerModel.attributes);

      opts.map =  leafletMap;

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
        self.featureOver  && self.featureOver.apply(self, arguments);
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
        self.featureOut  && self.featureOut.apply(self, arguments);
      };

      opts.featureClick  = _.debounce(function() {
        _featureClick  && _featureClick.apply(self, arguments);
        self.featureClick  && self.featureClick.apply(self, arguments);
      }, 10);


      base.prototype.initialize.call(this, opts);
      LeafletLayerView.call(this, layerModel, this, leafletMap);

    },

    featureOver: function(e, latlon, pixelPos, data, layer) {
      // dont pass leaflet lat/lon
      this.trigger('featureOver', e, [latlon.lat, latlon.lng], pixelPos, data, layer);
    },

    featureOut: function(e, layer) {
      this.trigger('featureOut', e, layer);
    },

    featureClick: function(e, latlon, pixelPos, data, layer) {
      // dont pass leaflet lat/lon
      this.trigger('featureClick', e, [latlon.lat, latlon.lng], pixelPos, data, layer);
    },

    error: function(e) {
      this.trigger('error', e ? (e.errors || e) : 'unknown error');
      this.model.trigger('error', e?e.errors:'unknown error');
    },

    ok: function(e) {
      this.model.trigger('tileOk');
    }
  });

  return layerViewClass;
};

module.exports = layerView;
