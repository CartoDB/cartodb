var Backbone = require('backbone');

/**
 * Model for general editor configuration.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    edition: false
  },
  isEditing: function () {
    return !!this.get('edition');
  }
});
