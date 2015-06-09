var cdb = require('cartodb.js');
var SelectColumnsView = require('./select_columns_view');

module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Select the columns you want to add as well.',

    actualFields: [],
    mergeFields: []
  },

  createView: function() {
    return new SelectColumnsView({
      model: this,
      table: this.get('table')
    });
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose the rest to add'
  }
});
