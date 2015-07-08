var _ = require('underscore');
var cdb = require('cartodb.js');
var CityNamesView = require('./city_names_view');

/**
 * Model for the city names georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'City Names',
  kind: 'namedplace',

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
    this._setStateForFirstStep();
    return new CityNamesView({
      model: this
    });
  },

  assertIfCanContinue: function() {
    var requiredAttrForCurrentStep = this.get('step') === 0 ? 'columnName' : 'geometryType';
    this.set('canContinue', !!this.get(requiredAttrForCurrentStep));
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
    return this.get('geocodeStuff').availableGeometriesFetchData(this.kind, this.get('location'), this.get('isLocationFreeText'));
  },

  _setStateForFirstStep: function() {
    this.set({
      step: 0,
      canGoBack: false,
      canContinue: false,
      continueLabel: undefined,
      column_name: '',
      location: '',
      isLocationFreeText: false,
      region: '',
      isRegionFreeText: false
    });
  },

  _setStateForSecondStep: function() {
    this.set({
      step: 1,
      canGoBack: true,
      canContinue: false,
      continueLabel: 'Georeference',
      geometryType: ''
    });
  },

  _geocode: function() {
    var d = this.get('geocodeStuff').geocodingChosenData({
      type: 'city',
      kind: this.kind,
      location: this.get('location'),
      column_name: this.get('columnName'),
      geometry_type: this.get('geometryType')
    }, this.get('isLocationFreeText'));

    var region = this.get('region');
    if (!_.isEmpty(region)) {
      d.region = region;
      d.region_text = this.get('isRegionFreeText');
    }

    this.set('geocodeData', d);
  }

});
