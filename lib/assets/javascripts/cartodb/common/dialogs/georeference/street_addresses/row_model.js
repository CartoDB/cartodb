var cdb = require('cartodb.js');
var RowView = require('./row_view');

/**
 * Model for an individual row
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    label: '',
    columnOrFreeTextValue: '',
    isFreeText: false,
    data: []
  },

  createView: function() {
    return new RowView({
      model: this
    });
  }

});
