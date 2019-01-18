var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ChooseKeyColumnsModel = require('./choose_key_columns_model');

/**
 * Entry point model that represents the merge flavor of doing a column merge.
 */
module.exports = cdb.core.Model.extend({

  ILLUSTRATION_ICON_TYPE: 'IllustrationIcon--alert',
  ICON: 'CDB-IconFont-mergeColumns',
  TITLE: 'Column join',
  DESC: 'Merge two datasets based on a shared value (ex. ISO codes in both datasets)',

  defaults: {
    user: undefined,
    table: undefined,
    excludeColumns: []
  },

  initialize: function(attrs) {
    if (!attrs.table) throw new Error('table is required');
    if (!attrs.excludeColumns || _.isEmpty(attrs.excludeColumns)) cdb.log.error('excludeColumns was empty');
  },

  isAvailable: function() {
    // Need at least one more column than the_geom to do a column merge
    return _.chain(this.get('table').get('schema'))
      .map(this._columnDataName)
      .difference(this.get('excludeColumns'))
      .any(this._isntTheGeomName)
      .value();
  },

  _columnDataName: function(columnData) {
    return columnData[0]; //name
  },

  _isntTheGeomName: function(columnName) {
    return columnName !== 'the_geom';
  },

  firstStep: function() {
    return new ChooseKeyColumnsModel({
      user: this.get('user'),
      leftTable: this.get('table'),
      excludeColumns: this.get('excludeColumns')
    });
  }

});
