var cdb = require('cartodb.js');
var CityNamesView = require('./city_names_view');

/**
 * Model for the city names georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'City Names',

  defaults: {
    columns: []
  },

  initialize: function(attrs) {
    if (!attrs.columnsNames) throw new Error('columnsNames is required');
    if (!attrs.columns) throw new Error('columns is required');
  },

  createView: function() {
    // Reset state
    this.set({
      canContinue: false,
      cityColumnName: '',
      adminRegion: '',
      country: ''
    });

    return new CityNamesView({
      model: this
    });
  },

  assertIfCanContinue: function() {
    this.set('canContinue', !!this.get('cityColumnName'));
  },

  geocodeData: function() {
  }

});
