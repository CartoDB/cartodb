var cdb = require('cartodb.js');
var _ = require('underscore');
var ChooseRightDatasetModel = require('./choose_right_dataset_model');

/**
 * Entry point model that represents the merge flavor of doing a spatial merge.
 */
module.exports = cdb.core.Model.extend({

  illustrationIconType: 'IllustrationIcon--royal',
  icon: 'iconFont-MergeSpatial',
  title: 'Spatial join',
  desc: 'Measure the number of intesecting records between two dataets (ex. count point inside polygons)',
  statsFlavor: 'spatial',

  defaults: {
    user: undefined,
    table: undefined,
    excludeColumns: []
  },

  initialize: function(attrs) {
    if (!attrs.user) throw new Error('user is required');
    if (!attrs.table) throw new Error('table is required');
    if (!attrs.excludeColumns || _.isEmpty(attrs.excludeColumns)) cdb.log.error('excludeColumns was empty');
  },

  isAvailable: function() {
    return true;
  },

  firstStep: function() {
    return new ChooseRightDatasetModel({
      user: this.get('user'),
      leftTable: this.get('table'),
      excludeColumns: this.get('excludeColumns')
    });
  }

});
