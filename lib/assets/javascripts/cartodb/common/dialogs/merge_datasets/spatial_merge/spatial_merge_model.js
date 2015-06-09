var cdb = require('cartodb.js');
var ChooseDatasetModel = require('./choose_dataset_model');

module.exports = cdb.core.Model.extend({

  defaults: {
    illustrationIconType: 'IllustrationIcon--royal',
    icon: 'iconFont-Question',
    title: 'Spatial join',
    desc: 'Measure the number of intesecting records between two dataets (ex. count point inside polygons)'
  },

  isAvailable: function() {
    return true;
  },

  firstStep: function() {
    return new ChooseDatasetModel({
    });
  }

});
