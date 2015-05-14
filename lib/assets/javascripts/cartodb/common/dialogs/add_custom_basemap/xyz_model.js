var cdb = require('cartodb.js');
var XYZView = require('./xyz_view');

/**
 * View model for XYZ tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'xyz',
    label: 'XYZ'
  },

  createView: function() {
    return new XYZView({
      model: this
    });
  }
});
