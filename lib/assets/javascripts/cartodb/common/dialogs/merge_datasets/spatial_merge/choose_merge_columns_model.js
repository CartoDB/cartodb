var cdb = require('cartodb.js');
var SpatialMergeView = require('./spatial_merge_view');

/**
 * Step 2 for a spatial merge, select columns to merge.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
      "You'll need to decide the operation to perform here.",

    leftTable: undefined,
    leftKeyColumn: undefined,
    leftColumns: undefined,
    rightTableData: undefined,
    rightKeyColumn: undefined,
    rightColumns: undefined
  },

  reset: function() {
  },

  createView: function() {
    return new SpatialMergeView({
      model: this
    });
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose merge columns'
  }
});
