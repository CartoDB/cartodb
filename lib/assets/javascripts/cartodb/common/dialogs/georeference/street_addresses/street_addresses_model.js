var _ = require('underscore-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var moment = require('moment-v3');
var cdb = require('cartodb.js-v3');
var StreetAddressesView = require('./street_addresses_view');
var RowModel = require('../row_model');
var StreetRowModel = require('./street_row_model');

/**
 * Model for the street addresses georeference option.
 */
module.exports = cdb.core.Model.extend({

  TAB_LABEL: 'Street Addresses',
  MAX_STREET_ROWS: 3,

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
  },

  createView: function() {
    this.set({
      canContinue: false,
      hideFooter: false,
      mustAgreeToTOS: false,
      confirmTOS: false,
      hasAgreedToTOS: false
    });
    this._initRows();

    return new StreetAddressesView({
      model: this
    });
  },

  isDisabled: function() {
    return !this.get('isGoogleMapsUser') && this.get('userGeocoding').hasReachedMonthlyQuota();
  },

  showCostsInfo: function() {
    return !this.get('isGoogleMapsUser');
  },

  getFormatterItemByRow: function(m) {
    var val = m.get('value');
    if (val) {
      return m.get('isFreeText') ? val.trim() : '{' + val + '}';
    }
  },

  assertIfCanAddMoreRows: function() {
    // If can add more rows, enable the add button only on the last street row
    var streetRows = this.get('rows').filter(this._isStreetRow);
    _.invoke(streetRows, 'set', 'canAddRow', false);
    _.last(streetRows).set('canAddRow', streetRows.length < this.MAX_STREET_ROWS);
  },

  daysLeftToNextBilling: function() {
    var today = moment().startOf('day');
    return moment(this.get('lastBillingDate')).add(30, 'days').diff(today, 'days')
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

  hasHardLimit: function() {
    return !!this.get('userGeocoding').get('hard_limit');
  },

  _hasAgreedToTOS: function() {
    return this.get('mustAgreeToTOS') && this.get('hasAgreedToTOS');
  },

  _isStreetRow: function(row) {
    return row instanceof StreetRowModel;
  },

  _initRows: function() {
    var columns = this.get('columns');
    var isDisabled = this.isDisabled();
    var rows = new Backbone.Collection([
      new StreetRowModel({
        label: 'Which column are your street addresses stored in?',
        data: columns,
        canAddRow: true,
        disabled: isDisabled
      }),
      new RowModel({
        label: 'State/province where address is located, if known',
        data: columns,
        disabled: isDisabled
      }),
      new RowModel({
        label: 'Country where street address is located, if known',
        data: columns,
        disabled: isDisabled
      })
    ]);
    this.set('rows', rows);
  }

});
