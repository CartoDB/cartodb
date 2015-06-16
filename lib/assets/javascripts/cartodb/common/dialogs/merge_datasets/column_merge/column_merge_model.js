var _ = require('underscore');
var cdb = require('cartodb.js');
var ChooseKeyColumnsModel = require('./choose_key_columns_model');

/**
 * Entry point model that represents the merge flavor of doing a column merge.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    illustrationIconType: 'IllustrationIcon--alert',
    icon: 'iconFont-Question',
    title: 'Column join',
    desc: 'Merge two datasets based on a shared value (ex. ISO codes in both datasets)',
    statsFlavor: 'regular', // flavor name from old modal, keep to not have to change stats

    user: undefined,
    table: undefined,
    excludeColumns: []
  },

  initialize: function(attrs) {
    if (!attrs.table) throw new Error('table is required');
    if (!attrs.excludeColumns || _.isEmpty(attrs.excludeColumns)) cdb.log.error('excludeColumns was empty');
    this.elder('initialize');
  },

  isAvailable: function() {
    // Need at least one more column than the_geom to do a column merge
    return _.chain(this.get('table').get('schema'))
      .map(this._columnDataName)
      .without(this.get('excludeColumns'))
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
