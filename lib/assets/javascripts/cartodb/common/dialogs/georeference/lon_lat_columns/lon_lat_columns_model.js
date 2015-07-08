var cdb = require('cartodb.js');
var LonLatColumnsView = require('./lon_lat_columns_view');

/**
 * Model for the Lon/Lat georeference option.
 */
module.exports = cdb.core.Model.extend({

  TAB_LABEL: 'Lon/Lat Columns',

  defaults: {
    columnsNames: []
  },

  initialize: function(attrs) {
    if (!attrs.geocodeStuff) throw new Error('geocodeStuff is required');
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
    var d = this.get('geocodeStuff').geocodingChosenData({
      type: 'lonlat',
      longitude: this.get('longitude'),
      latitude: this.get('latitude')
    });

    this.set('geocodeData', d);
  }
});
