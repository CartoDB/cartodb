var _ = require('underscore');
var cdb = require('cartodb.js');
var ChooseKeyColumnsModel = require('./choose_key_columns_model');

module.exports = cdb.core.Model.extend({

  defaults: {
    illustrationIconType: 'IllustrationIcon--alert',
    icon: 'iconFont-Question',
    title: 'Column join',
    desc: 'Merge two datasets based on a shared value (ex. ISO codes in both datasets)',

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
      .map(function(column) {
        return column[0]; //name
      })
      .without(this.get('excludeColumns'))
      .any(function(columnName) {
        return columnName !== 'the_geom';
      })
      .value();
  },

  firstStep: function() {
    return new ChooseKeyColumnsModel({
      leftTable: this.get('table'),
      excludeColumns: this.get('excludeColumns')
    });
  }

});
