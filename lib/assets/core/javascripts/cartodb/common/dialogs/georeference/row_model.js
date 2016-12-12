var cdb = require('cartodb.js-v3');
var RowView = require('./row_view');

/**
 * Model for an individual row
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    comboViewClass: 'CustomTextCombo',
    label: '',
    placeholder: 'Select column or type it',
    isFreeText: false,
    data: []
  },

  createView: function() {
    return new RowView({
      model: this
    });
  }

});
