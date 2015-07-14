var cdb = require('cartodb.js');
var PostalCodesView = require('./postal_codes_view');

/**
 * Model for the postal codes georeference option.
 */
module.exports = cdb.core.Model.extend({

  TAB_LABEL: 'Postal Codes',
  kind: 'postalcode',

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
    return new PostalCodesView({
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
      hideFooter: false,
      columnName: '',
      location: ''
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
      kind: this.kind,
      location: this.get('location'),
      column_name: this.get('columnName'),
      geometry_type: this.get('geometryType')
    }, this.get('isLocationFreeText'));

    this.set('geocodeData', d);
  }

});
