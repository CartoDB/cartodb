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
    if (!attrs.columnsNames) throw new Error('columnsNames is required');
    if (!attrs.columns) throw new Error('columns is required');
  },

  createView: function() {
    // Reset state
    this.set({
      step: 0,
      canContinue: false,
      column_name: '',
      region: '',
      location: '',
      geometryType: ''
    });

    return new CityNamesView({
      model: this
    });
  },

  assertIfCanContinue: function() {
    var requiredAttrForCurrentStep = this.get('step') === 0 ? 'column_name' : 'geometryType';
    this.set('canContinue', !!this.get(requiredAttrForCurrentStep));
  },

  continue: function() {
    if (this.get('step') === 0) {
      this._setStateForStep1();
    } else {
      this._geocode();
    }
  },

  _setStateForStep1: function() {
    this.set({
      step: 1,
      canContinue: false,
      geometryType: ''
    });
  },

  _geocode: function() {
    var d = {
      type: 'city',
      kind: this.kind,
      column_name: this.get('column_name'),
      location: this.get('location'),
      geometry_type: this.get('geometryType')
    };

    var region = this.get('region');
    if (!_.isEmpty(region)) {
      d.region = region;
    }

    this.set('geocodeData', d);
  }

});
