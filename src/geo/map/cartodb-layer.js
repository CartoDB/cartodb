var _ = require('underscore');
var config = require('cdb.config');
var MapLayer = require('./map-layer');

var CartoDBLayer = MapLayer.extend({

  defaults: {
    attribution: config.get('cartodb_attributions'),
    type: 'CartoDB',
    visible: true
  },

  initialize: function() {
    MapLayer.prototype.initialize.apply(this, arguments);
  },

  activate: function() {
    this.set({active: true, opacity: 0.99, visible: true});
  },

  deactivate: function() {
    this.set({active: false, opacity: 0, visible: false});
  },

  // TODO: This is probably not used anymore
  invalidate: function() {
    var e = this.get('extra_params') || e;
    e.cache_buster = new Date().getTime();
    this.set('extra_params', e);
    this.trigger('change', this);
  },

  toggle: function() {
    if(this.get('active')) {
      this.deactivate();
    } else {
      this.activate();
    }
  },

  hasInteraction: function() {
    return this.isVisible() && (this.containInfowindow() || this.containTooltip());
  },

  isVisible: function() {
    return this.get('visible');
  },

  getTooltipFieldNames: function() {
    var names = [];
    var tooltip = this.getTooltipData();
    if (tooltip && tooltip.fields) {
      names = _.pluck(tooltip.fields, 'name');
    }
    return names;
  },

  getTooltipData: function() {
    var tooltip = this.get('tooltip');
    if (tooltip && tooltip.fields && tooltip.fields.length) {
      return tooltip;
    }
    return null;
  },

  containInfowindow: function() {
    return !!this.getTooltipData();
  },

  getInfowindowFieldNames: function() {
    var names = [];
    var infowindow = this.getInfowindowData();
    if (infowindow  && infowindow.fields) {
      names = _.pluck(infowindow.fields, 'name');
    }
    return names;
  },

  getInfowindowData: function() {
    var infowindow = this.get('infowindow');
    if (infowindow && infowindow.fields && infowindow.fields.length) {
      return infowindow;
    }
    return null;
  },

  containTooltip: function() {
    return !!this.getInfowindowData();
  },

  getInteractiveColumnNames: function() {
    return _.uniq(
      ['cartodb_id']
        .concat(this.getInfowindowFieldNames())
         .concat(this.getTooltipFieldNames())
    );
  },

  // Layers inside a "layergroup" layer have the layer_name defined in options.layer_name
  // Layers inside a "namedmap" layer have the layer_name defined in the root of their definition
  getName: function() {
    return this.get('options') && this.get('options').layer_name || this.get('layer_name');
  }
});

module.exports = CartoDBLayer;
