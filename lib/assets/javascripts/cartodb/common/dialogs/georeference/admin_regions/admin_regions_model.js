var cdb = require('cartodb.js');
var CityNamesView = require('./admin_regions_view');

/**
 * Model for the administrative regions georeference option.
 */
module.exports = cdb.core.Model.extend({

  tabLabel: 'Admin. Regions',
  kind: 'admin1',

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
      columnName: '',
      location: ''
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
    var geocodeStuff = this.get('geocodeStuff');
    var location = this.get('location');
    var isLocationFreeText = this.get('isLocationFreeText');

    var d = geocodeStuff.geocodingChosenData({
      type: 'admin',
      kind: geocodeStuff.isLocationWorld(location, isLocationFreeText) ? 'admin0' : this.kind, // migrated from old code, unclear why this is needed
      location: location,
      column_name: this.get('columnName'),
      geometry_type: this.get('geometryType')
    }, isLocationFreeText);

    this.set('geocodeData', d);
  }

});
