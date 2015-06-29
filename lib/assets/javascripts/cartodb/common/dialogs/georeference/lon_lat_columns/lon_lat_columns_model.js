var cdb = require('cartodb.js');
var LonLatColumnsView = require('./lon_lat_columns_view');

/**
 * Model for the Lon/Lat georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'Lon/Lat Columns',

  defaults: {
    columnsNames: []
  },

  initialize: function(attrs) {
    if (!attrs.columnsNames) throw new Error('columnsNames is required');
  },

  createView: function() {
    this.set({
      canContinue: false,
      longitude: '',
      latitude: ''
    });

    return new LonLatColumnsView({
      model: this
    });
  },

  assertIfCanContinue: function() {
    var canContinue = !!(this.get('longitude') && this.get('latitude'));
    this.set('canContinue', canContinue);
  },

  continue: function() {
    this.set('geocodeData', {
      type: 'lonlat',
      longitude: this.get('longitude'),
      latitude: this.get('latitude')
    });
  }
});
