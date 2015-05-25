var cdb = require('cartodb.js');
var NASAView = require('./nasa_view');

/**
 * View model for XYZ tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'nasa',
    label: 'NASA',
    baseLayers: undefined, // Backbone.Collection

    // for date picker
    date: undefined,
    current: undefined,
    format: 'Y-m-d' // YYYY-MM-DD
  },

  createView: function() {
    this.set({
      date: new Date(),
      current: new Date()
    });

    return new NASAView({
      model: this
    });
  }
});
