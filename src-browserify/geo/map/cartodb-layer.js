var config = require('cdb.config');
var MapLayer = require('./map-layer');

var CartoDBLayer = MapLayer.extend({

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
    maxZoom: 28
  },

  activate: function() {
    this.set({active: true, opacity: 0.99, visible: true})
  },

  deactivate: function() {
    this.set({active: false, opacity: 0, visible: false})
  },

  // refresh the layer
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
});

module.exports = CartoDBLayer;
