const Backbone = require('backbone');

/**
 *  User notification default model
 */

module.exports = Backbone.Model.extend({
  defaults: {
    type: '',
    message: '',
    opened: false
  }
});
