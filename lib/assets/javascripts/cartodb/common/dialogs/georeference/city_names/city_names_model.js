var cdb = require('cartodb.js');
var ViewFactory = require('../../../view_factory');

/**
 * Model for the city names georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'City Names',

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
