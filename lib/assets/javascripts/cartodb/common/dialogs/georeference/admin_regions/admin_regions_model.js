var _ = require('underscore');
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

  _setStateForFirstStep: function() {
    this.set({
      step: 0,
      canGoBack: false,
      canContinue: false,
      continueLabel: undefined,
      columnName: '',
      location: '',
      geometryType: ''
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
    var d = {
      type: 'admin',
      kind: this.kind,
      column_name: this.get('columnName'),
      location: this.get('location'),
      geometry_type: this.get('geometryType')
    };

    this.set('geocodeData', d);
  }

});
