var cdb = require('cartodb.js');
var Backbone = require('backbone');
var StepsView = require('./steps_view');
var RowModel = require('./row_model');

/**
 * Model for the administrative regions georeference option.
 */
module.exports = cdb.core.Model.extend({

  TAB_LABEL: 'Admin. Regions',
  TITLE: 'Select the column that has Administrative Regions',
  DESC: "Georeference your data by country’s, state's, province's or municipality’s",
  KIND: 'admin1',

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

    return new StepsView({
      model: this
    });
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
    this.get('rows').invoke('unset', 'value');
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

  _initRows: function() {
    var rows = new Backbone.Collection([
      new RowModel({
        comboViewClass: 'Combo',
        label: 'In which column are your region names stored?',
        placeholder: 'Select column',
        data: this.get('columnsNames')
      }),
      new RowModel({
        label: "If your column isn't country data, where's it?",
        data: this.get('columns')
      })
    ]);
    this.set('rows', rows);
  },

  _geocode: function() {
    var geocodeStuff = this.get('geocodeStuff');
    var locationValue = this._locationValue();
    var isLocationFreeText = this._isLocationFreeText();

    var d = geocodeStuff.geocodingChosenData({
      type: 'admin',
      kind: geocodeStuff.isLocationWorld(locationValue, isLocationFreeText, true) ? 'admin0' : this.KIND, // migrated from old code, unclear why this is needed
      location: locationValue,
      column_name: this._columnNameValue(),
      geometry_type: this.get('geometryType')
    }, isLocationFreeText, true);

    this.set('geocodeData', d);
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
