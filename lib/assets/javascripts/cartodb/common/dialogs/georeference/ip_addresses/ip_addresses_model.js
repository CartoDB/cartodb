var cdb = require('cartodb.js');
var ViewFactory = require('../../../view_factory');

/**
 * Model for the IP addresses georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'IP Addresses',

  createView: function() {
    // Reset state
    this.set({
      canContinue: false
    });

    return ViewFactory.createByTemplate('common/templates/fail', {
      msg: 'TBD, pending implementation for new tab'
    });
  },

  geocodeData: function() {
    // TODO: stub, implement actual logic
  }

});
