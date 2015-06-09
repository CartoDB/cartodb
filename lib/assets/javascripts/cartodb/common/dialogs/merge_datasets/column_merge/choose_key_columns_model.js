var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var ChooseKeyColumnsView = require('./choose_key_columns_view');
var SelectColumns = require('./select_columns_model');

module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'First, select the column you want to merge in both datasets. ' +
      'You can only merge datasets by joining by columns of the same type (e.g. number to a number).',

    // Given/set in initialize
    table: undefined,
    actualColumns: undefined,

    // These should be set for next step
    actualKeyColumn: undefined,
    mergeTableGeom: undefined,
    mergeKeyColumn: undefined
  },

  initialize: function() {
    this.elder('initialize');

    var availableColumns = _.reject(this.get('filteredColumns'), function(column) {
      return column[0] === 'the_geom';
    });
    this.set('actualColumns', new Backbone.Collection(availableColumns));
  },

  createView: function() {
    return new ChooseKeyColumnsView({
      model: this
    });
  }

}, {
  header: {
    icon: 'iconFont-Play',
    title: 'Choose merge column'
  },
  nextStep: SelectColumns
});
