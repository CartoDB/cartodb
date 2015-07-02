var cdb = require('cartodb.js');
var IpAddressesView = require('./ip_addresses_view');

/**
 * Model for the IP addresses georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'IP Addresses',

  initialize: function(attrs) {
    if (!attrs.geocodeStuff) throw new Error('geocodeStuff is required');
    if (!attrs.columnsNames) throw new Error('columnsNames is required');
  },

  createView: function() {
    this.set({
      canContinue: false,
      columnName: ''
    });

    return new IpAddressesView({
      model: this
    });
  },

  assertIfCanContinue: function() {
    this.set('canContinue', !!this.get('columnName'));
  },

  continue: function() {
    var d = this.get('geocodeStuff').geocodingChosenData({
      type: 'ip',
      kind: 'ipaddress',
      column_name: this.get('columnName'),
      geometry_type: 'point'
    });

    this.set('geocodeData', d);
  }
});
