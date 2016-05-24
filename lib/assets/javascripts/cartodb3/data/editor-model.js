var cdb = require('cartodb.js');

/**
 * Model for general editor configuration.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    edition: false
  },
  isEditing: function () {
    return this.get('edition');
  }
});
