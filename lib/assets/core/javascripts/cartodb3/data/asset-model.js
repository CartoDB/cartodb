var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  defaults: {
    state: 'idle',
    name: ''
  }
});
