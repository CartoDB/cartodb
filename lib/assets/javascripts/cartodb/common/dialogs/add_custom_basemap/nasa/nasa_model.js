var cdb = require('cartodb.js');
var NASAView = require('./nasa_view');

/**
 * View model for XYZ tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'nasa',
    label: 'NASA',
    baseLayers: undefined // Backbone.Collection
  },

  createView: function() {
    return new NASAView({
      model: this
    });
  }
});
