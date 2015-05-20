var cdb = require('cartodb.js');
var WMSView = require('./wms_view');

/**
 * View model for WMS/WMTS tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'wms',
    label: 'WMS/WMTS',
    layers: undefined // will be set by WMSService
  },

  createView: function() {
    this.set(this.defaults); // reset state
    return new WMSView({
      model: this
    });
  },

  fetchLayers: function(url) {
    this.set('layers', undefined, { silent: true }); //reset
    var wmsService = new cdb.admin.WMSService({
      wms_url: url
    });

    var self = this;
    wmsService.fetch({
      success: function() {
        var layers = wmsService.get('layers');
        if (layers && layers.length > 0) {
          self.set('layers', layers);
        } else {
          self._fetchLayerFailed();
        }
      },
      error: this._fetchLayerFailed.bind(this)
    });
  },

  layersFetched: function() {
    return this.get('layers');
  },

  layersAvailable: function() {
    return this.get('layers');
  },

  _fetchLayerFailed: function() {
    this.set('layers', []);
  }
});
