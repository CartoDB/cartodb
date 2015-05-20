var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

  available: function() {
    return this.models;
  }
});
