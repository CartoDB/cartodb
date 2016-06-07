var Backbone = require('backbone');

/**
 *  Table view model
 */

module.exports = Backbone.Model.extend({

  defaults: {
    page: 0
  },

  setDefaults: function () {
    this.set(this.defaults);
  }

});
