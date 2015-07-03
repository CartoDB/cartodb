var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var StreetAddressesView = require('./street_addresses_view');
var RowModel = require('./row_model');

/**
 * Model for the street addresses georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'Street Addresses',

  defaults: {
    columnsNames: [],
    columns: [],
    estimation: undefined
  },

  initialize: function(attrs) {
    if (!attrs.geocodeStuff) throw new Error('geocodeStuff is required');
    if (!_.isBoolean(attrs.isGoogleMapsUser)) throw new Error('isGoogleMapsUser is required');
    if (!attrs.userGeocoding) throw new Error('userGeocoding is required');
    if (!attrs.columns) throw new Error('columns is required');
    if (!attrs.estimation) throw new Error('estimation is required'); // cdb.admin.Geocodings.Estimations
    this._initRows();
  },

  createView: function() {
    this.set({
      canContinue: false,
      mustAgreeToTOS: false,
      confirmTOS: false,
      hasAgreedToTOS: false
    });

    return new StreetAddressesView({
      model: this
    });
  },

  getFormatterItemByRow: function(m) {
    var val = m.get('columnOrFreeTextValue');
    if (val) {
      return m.get('isFreeText') ? val.trim() : '{' + val + '}';
    }
  },

  continue: function() {
    var mustAgreeToTOS = this.get('mustAgreeToTOS');

    if (this._hasAgreedToTOS() || !mustAgreeToTOS) {
      var d = this.get('geocodeStuff').geocodingChosenData({
        type: 'address',
        kind: 'high-resolution',
        formatter: this.get('formatter')
      });
      this.set('geocodeData', d);
    } else if (mustAgreeToTOS) {
      this.set('confirmTOS', true);
    }
  },

  isHardLimit: function() {
    return this.get('userGeocoding').get('hard_limit');
  },

  _hasAgreedToTOS: function() {
    return this.get('mustAgreeToTOS') && this.get('hasAgreedToTOS');
  },

  _initRows: function() {
    var columns = this.get('columns');
    var rows = new Backbone.Collection([
      new RowModel({
        label: 'Which column are your street addresses stored in?',
        data: columns
      }),
      new RowModel({
        label: 'State/province where address is located, if known',
        data: columns
      }),
      new RowModel({
        label: 'Country where street address is located, if known',
        data: columns
      })
    ]);
    this.set('rows', rows);
  }

});
