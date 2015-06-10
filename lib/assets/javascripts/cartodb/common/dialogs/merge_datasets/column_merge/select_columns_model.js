var cdb = require('cartodb.js');
var _ = require('underscore');
var SelectColumnsView = require('./select_columns_view');

/**
 * View for 2nd step of a column merge, where the user should select the column fields to merge
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Select the columns you want to add as well.',

    isReadyForNextStep: true,
    actualTable: undefined,
    actualKeyColumn: undefined,
    actualColumns: undefined,
    mergeTableData: undefined,
    mergeColumns: undefined,
    mergeKeyColumn: undefined
  },

  initialize: function() {
    this.elder('initialize');

    // always set at least one the_geom to be enabled
    this._theGeomColumnFor('mergeColumns').set('selected', true);
  },

  reset: function() {
    // no-op
  },

  createView: function() {
    return new SelectColumnsView({
      model: this
    });
  },

  onlyAllowOneSelectedTheGeomColumn: function(column, isSelected) {
    if (column.get('0') !== 'the_geom') return;

    var actualColumn = this._theGeomColumnFor('actualColumns');
    var mergeColumn = this._theGeomColumnFor('mergeColumns');

    if (column === actualColumn) {
      actualColumn.set('selected', isSelected);
      mergeColumn.set('selected', !isSelected);
    } else if (column === mergeColumn) {
      actualColumn.set('selected', !isSelected);
      mergeColumn.set('selected', isSelected);
    }
  },
  _theGeomColumnFor: function(which) {
    return this.get(which).find(function(column) {
      return column.get('0') === 'the_geom';
    });
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose the rest to add'
  }
});
