var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  defaults: {
    type: 'formula',
    column: ''
  }
});
