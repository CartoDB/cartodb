var cdb = require('cartodb.js');
var ChooseColumnView = require('./choose_column_view');

module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
      "You'll need to decide the operation to perform here."
  },
  
  reset: function() {
  },

  createView: function() {
    return new ChooseColumnView({
    });
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose merge columns'
  }
});
