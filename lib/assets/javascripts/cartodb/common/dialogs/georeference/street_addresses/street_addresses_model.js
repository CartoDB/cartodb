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
    columns: []
  },

  initialize: function(attrs) {
    if (!attrs.geocodeStuff) throw new Error('geocodeStuff is required');
    if (!attrs.columns) throw new Error('columns is required');
    this._initRows();
  },

  createView: function() {
    this.set({
      canContinue: false
    });

    return new StreetAddressesView({
      model: this
    });
  },

  onChangeRows: function() {
    var formatter = this.get('rows').chain()
      .map(this._getFormatterItemByRow)
      .compact() // there might be rows that have no value, if so skip them
      .value().join(', ');

    this.set({
      formatter: formatter,
      canContinue: !_.isEmpty(formatter)
    });
  },

  continue: function() {
    if (!this.get('canContinue')) return;

    var d = this.get('geocodeStuff').geocodingChosenData({
      type: 'address',
      kind: 'high-resolution'
    });

    this.set('geocodeData', d);
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
  },

  _getFormatterItemByRow: function(m) {
    var val = m.get('columnOrFreeTextValue');
    if (val) {
      return m.get('isFreeText') ? val.trim() : '{' + val + '}';
    }
  }

});
