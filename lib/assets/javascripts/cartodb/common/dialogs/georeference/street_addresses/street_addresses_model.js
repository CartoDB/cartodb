var cdb = require('cartodb.js');
var StreetAddressesView = require('./street_addresses_view');

/**
 * Model for the street addresses georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'Street Addresses',

  defaults: {
    columnsNames: [],
    columns: []
  },

  initialize: function(attrs) {
    if (!attrs.geocodeStuff) throw new Error('geocodeStuff is required');
    if (!attrs.columns) throw new Error('columns is required');
  },

  createView: function() {
    this.set({
      canContinue: false
    });

    return new StreetAddressesView({
      model: this
    });
  },

  assertIfCanContinue: function() {
    var canContinue = false;
    this.set('canContinue', canContinue);
  },

  continue: function() {
    if (!this.get('canContinue')) return;

    var d = this.get('geocodeStuff').geocodingChosenData({
      type: 'address',
      kind: 'high-resolution'
    });

    this.set('geocodeData', d);
  }

});
