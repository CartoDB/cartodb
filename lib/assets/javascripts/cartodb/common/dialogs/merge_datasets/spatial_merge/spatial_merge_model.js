var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var ChooseRightDatasetModel = require('./choose_right_dataset_model');

/**
 * Entry point model that represents the merge flavor of doing a spatial merge.
 */
module.exports = cdb.core.Model.extend({

  ILLUSTRATION_ICON_TYPE: 'IllustrationIcon--royal',
  ICON: 'CDB-IconFont-mergeSpatial',
  TITLE: 'Spatial join',
  DESC: 'Measure the number of intesecting records between two datasets (ex. count point inside polygons)',

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
