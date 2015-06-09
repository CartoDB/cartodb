var cdb = require('cartodb.js');
var ChooseDatasetView = require('./choose_dataset_view');
var ChooseColumn = require('./choose_column_model');

module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
      "You'll need to decide the operation to perform here."
  },

  createView: function() {
    return new ChooseDatasetView({
    });
  }

}, {
  header: {
    icon: 'iconFont-Play',
    title: 'Choose dataset to merge'
  },
  nextStep: ChooseColumn
});
