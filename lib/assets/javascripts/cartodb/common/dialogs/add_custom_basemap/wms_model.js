var cdb = require('cartodb.js');
var WMSView = require('./wms_view');

/**
 * View model for WMS/WMTS tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'wms',
    label: 'WMS/WMTS'
  },

  createView: function() {
    return new WMSView({
      model: this
    });
  }
});
