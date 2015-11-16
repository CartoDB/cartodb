var Backbone = require('backbone');
var _ = require('underscore');
var config = require('cdb.config');
var MapLayer = require('./map-layer');

var CartoDBLayer = MapLayer.extend({

  // TODO: Cleanup this!
  defaults: {
    attribution: config.get('cartodb_attributions'),
    type: 'CartoDB',
    active: true,
    query: null,
    opacity: 0.99,
    interactivity: null,
    interaction: true,
    debug: false,
    tiler_domain: "cartodb.com",
    tiler_port: "80",
    tiler_protocol: "http",
    sql_api_domain: "cartodb.com",
    sql_api_port: "80",
    sql_api_protocol: "http",
    extra_params: {},
    cdn_url: null,
    maxZoom: 28,
    cartocss_version: '2.1.0',
    visible: true
  },

  initialize: function() {
    this.widgets = new Backbone.Collection([]);

    // Re-trigger the change:filter event
    this.widgets.bind('change:filter', function(widget, filter) {
      this.trigger('change:filter', this, widget, filter);
    }, this);

    MapLayer.prototype.initialize.apply(this, arguments);
  },

  activate: function() {
    this.set({active: true, opacity: 0.99, visible: true});
  },

  deactivate: function() {
    this.set({active: false, opacity: 0, visible: false});
  },

  /**
   * refresh the layer
   */
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

  getFilters: function() {
    return this.widgets.map(function(widget) {
      return widget.getFilter();
    });
  },

  // Layers inside a "layergroup" layer have the layer_name defined in options.layer_name
  // Layers inside a "namedmap" layer have the layer_name defined in the root of their definition
  getName: function() {
    return this.get('options') && this.get('options').layer_name || this.get('layer_name');
  }
});

module.exports = CartoDBLayer;
