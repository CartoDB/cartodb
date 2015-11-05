var $ = require('jquery');
var _ = require('underscore');
var util = require('cdb.core.util');
var Profiler = require('cdb.core.Profiler');
var SubLayerFactory = require('../sub-layer/sub-layer-factory');

function MapBase(options) {
  var self = this;

  this.options = _.defaults(options, {});

  this.windshaftMap = null;
  this.silent = false;
  this._refreshTimer = -1;

  // build template url
  if (!this.options.maps_api_template) {
    this._buildMapsApiTemplate(this.options);
  }
}

MapBase.BASE_URL = '/api/v1/map';
MapBase.EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

MapBase.prototype = {

  _buildMapsApiTemplate: function(opts) {
    var tilerProtocol = opts.tiler_protocol;
    var tilerDomain = opts.tiler_domain;
    var tilerPort = (opts.tiler_port != "") ? (":" + opts.tiler_port) : "";
    var username = opts.user_name ? "{user}." : "";
    opts.maps_api_template = [tilerProtocol, "://", username, tilerDomain, tilerPort].join('');
  },

  _callbackName: function() {
    return util.uniqueCallbackName(JSON.stringify(this.toJSON()));
  },

  invalidate: function() {
    this.windshaftMap = null;
    this.onLayerDefinitionUpdated();
  },

  onLayerDefinitionUpdated: function() {},

  setSilent: function(b) {
    this.silent = b;
  },

  _definitionUpdated: function() {
    if(this.silent) return;
    this.invalidate();
  },

  // Methods to operate with layers
  getLayer: function(index) {
    return _.clone(this.layers[index]);
  },

  getLayerCount: function() {
    return this.layers ? this.layers.length: 0;
  },

  // given number inside layergroup
  // returns the real index in tiler layergroup`
  getLayerIndexByNumber: function(number) {
    var layers = {}
    var c = 0;
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      layers[i] = c;
      if(layer.options && !layer.options.hidden) {
        ++c;
      }
    }
    return layers[number];
  },

  /**
   * return the layer number by index taking into
   * account the hidden layers.
   */
  getLayerNumberByIndex: function(index) {
    var layers = [];
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      if(this._isLayerVisible(layer)) {
        layers.push(i);
      }
    }
    if (index >= layers.length) {
      return -1;
    }
    return +layers[index];
  },

  visibleLayers: function() {
    var layers = [];
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      if (this._isLayerVisible(layer)) {
        layers.push(layer);
      }
    }
    return layers;
  },

  _isLayerVisible: function(layer) {
    if (layer.options && 'hidden' in layer.options) {
      return !layer.options.hidden;
    }

    return layer.visible !== false;
  },

  setLayer: function(layer, def) {
    if(layer < this.getLayerCount() && layer >= 0) {
      if (def.options.hidden) {
        var i = this.interactionEnabled[layer];
        if (i) {
          def.interaction = true
          this.setInteraction(layer, false);
        }
      } else {
        if (this.layers[layer].interaction) {
          this.setInteraction(layer, true);
          delete this.layers[layer].interaction;
        }
      }
      this.layers[layer] = _.clone(def);
    }
    this.invalidate();
    return this;
  },

  getTooltipData: function(layer) {
    var tooltip = this.layers[layer].tooltip;
    if (tooltip && tooltip.fields && tooltip.fields.length) {
      return tooltip;
    }
    return null;
  },

  getInfowindowData: function(layer) {
    var lyr;
    var infowindow = this.layers[layer].infowindow;
    if (!infowindow && this.options.layer_definition && (lyr = this.options.layer_definition.layers[layer])) {
      infowindow = lyr.infowindow;
    }
    if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
      return infowindow;
    }
    return null;
  },

  containInfowindow: function() {
    var layers =  this.options.layer_definition.layers;
    for(var i = 0; i < layers.length; ++i) {
      var infowindow = layers[i].infowindow;
      if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
        return true;
      }
    }
    return false;
  },

  containTooltip: function() {
    var layers =  this.options.layer_definition.layers;
    for(var i = 0; i < layers.length; ++i) {
      var tooltip = layers[i].tooltip;
      if (tooltip && tooltip.fields && tooltip.fields.length) {
        return true;
      }
    }
    return false;
  },

  getSubLayer: function(index) {
    var layer = this.layers[index];
    layer.sub = layer.sub || SubLayerFactory.createSublayer(layer.type, this, index);
    return layer.sub;
  },

  getSubLayerCount: function() {
    return this.getLayerCount();
  },

  getSubLayers: function() {
    var layers = []
    for (var i = 0; i < this.getSubLayerCount(); ++i) {
      layers.push(this.getSubLayer(i))
    }
    return layers;
  }
};

module.exports = MapBase;
