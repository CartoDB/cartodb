var Backbone = require('backbone');

/**
 * Model for general editor configuration.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    edition: false,
    disabled: false
  },
  isEditing: function () {
    return !!this.get('edition');
  },
  isDisabled: function () {
    return !!this.get('disabled');
  }
});
