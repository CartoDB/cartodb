var cdb = require('cartodb.js');

/**
 *  Table view model
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    page: 0,
    maxRenderedRows: 80
  },

  setDefaults: function () {
    this.set(this.defaults);
  }

});
