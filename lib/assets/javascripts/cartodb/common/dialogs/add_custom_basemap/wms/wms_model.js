var cdb = require('cartodb.js');
var WMSView = require('./wms_view');
var Backbone = require('backbone');

/**
 * View model for WMS/WMTS tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'wms',
    label: 'WMS/WMTS',
    layers: undefined,
    layersFetched: false
  },

  initialize: function() {
    this.elder('initialize');
    this.set('layers', new Backbone.Collection());
  },

  createView: function() {
    this.get('layers').reset();
    this.set('layersFetched', false);
    return new WMSView({
      model: this
    });
  },

  fetchLayers: function(url) {
    this.set('layersFetched', false, { silent: true }); // reset this model

    var wmsService = new cdb.admin.WMSService({
      wms_url: url
    });

    var self = this;
    wmsService.fetch().always(function() {
      self.get('layers').reset(wmsService.get('layers'));
      self.set('layersFetched', true);
    });
  }

});
