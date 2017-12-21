var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var RowModel = require('./row_model');
var StepsView = require('./steps_view');
var DefaultFooterView = require('./default_footer_view');
var ViewFactory = require('../../view_factory');

/**
 * Model for the postal codes georeference option.
 */
module.exports = cdb.core.Model.extend({

  TAB_LABEL: 'Postal Codes',
  KIND: 'postalcode',

  defaults: {
    step: 0,
    columns: []
  },

  initialize: function(attrs) {
    if (!attrs.geocodeStuff) throw new Error('geocodeStuff is required');
    if (!attrs.columnsNames) throw new Error('columnsNames is required');
    if (!attrs.columns) throw new Error('columns is required');
  },

  createView: function() {
    this._initRows();
    this._setStateForFirstStep();

    return ViewFactory.createByList([
      new StepsView({
        title: 'Select the column that has the Postal Codes',
        desc: 'Georeference your data by postal codes.',
        model: this
      }),
      new DefaultFooterView({
        model: this
      })
    ]);
  },

  assertIfCanContinue: function() {
    var value = this.get('step') === 0 ? this._columnNameValue() : this.get('geometryType');
    this.set('canContinue', !!value);
  },

  continue: function() {
    if (this.get('step') === 0) {
      this._setStateForSecondStep();
    } else {
      this._geocode();
    }
  },

  goBack: function() {
    this._setStateForFirstStep();
  },

  availableGeometriesFetchData: function() {
    return this.get('geocodeStuff').availableGeometriesFetchData(this.KIND, this._locationValue(), this._isLocationFreeText());
  },

  _setStateForFirstStep: function() {
    this.set({
      step: 0,
      canGoBack: false,
      canContinue: false,
      hideFooter: false
    });
  },

  _setStateForSecondStep: function() {
    this.set({
      step: 1,
      canGoBack: true,
      canContinue: false,
      hideFooter: true,
      geometryType: ''
    });
  },

  _geocode: function() {
    var d = this.get('geocodeStuff').geocodingChosenData({
      type: 'postal',
      kind: this.KIND,
      location: this._locationValue(),
      column_name: this._columnNameValue(),
      geometry_type: this.get('geometryType')
    }, this._isLocationFreeText(), true);

    this.set('geocodeData', d);
  },

  _initRows: function() {
    var rows = new Backbone.Collection([
      new RowModel({
        comboViewClass: 'Combo',
        label: 'In which column are your postal codes stored?',
        placeholder: 'Select column',
        data: this.get('columnsNames')
      }),
      new RowModel({
        label: 'Country where postal codes are located, if known',
        data: this.get('columns')
      })
    ]);
    this.set('rows', rows);
  },

  _columnNameValue: function() {
    return this.get('rows').first().get('value');
  },

  _locationValue: function() {
    return this._location().get('value');
  },

  _isLocationFreeText: function() {
    return this._location().get('isFreeText');
  },

  _location: function() {
    return this.get('rows').last();
  }

});
