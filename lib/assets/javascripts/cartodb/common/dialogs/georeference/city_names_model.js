var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var StepsView = require('./steps_view');
var RowModel = require('./row_model');
var DefaultFooterView = require('./default_footer_view');
var ViewFactory = require('../../view_factory');

/**
 * Model for the city names georeference option.
 */
module.exports = cdb.core.Model.extend({

  TAB_LABEL: 'City Names',
  KIND: 'namedplace',

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
        title: "Select the column that contains the City's Name",
        desc: 'No matter the type of the columns you select, we will transform them to number for georeferencing.',
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
      type: 'city',
      kind: this.KIND,
      location: this._locationValue(),
      column_name: this._columnNameValue(),
      geometry_type: this.get('geometryType')
    }, this._isLocationFreeText(), true);

    var region = this._regionValue();
    if (!_.isEmpty(region)) {
      d.region = region;
      d.region_text = this._isRegionFreeText();
    }

    this.set('geocodeData', d);
  },

  _initRows: function() {
    var rows = new Backbone.Collection([
      new RowModel({
        comboViewClass: 'Combo',
        label: 'In which column are your city names stored?',
        placeholder: 'Select column',
        data: this.get('columnsNames')
      }),
      new RowModel({
        label: "Admin. Region where city's located, if known",
        data: this.get('columns')
      }),
      new RowModel({
        label: "Country where city's located, if known",
        data: this.get('columns')
      })
    ]);
    this.set('rows', rows);
  },

  _columnNameValue: function() {
    return this.get('rows').first().get('value');
  },

  _regionValue: function() {
    return this._region().get('value');
  },

  _isRegionFreeText: function() {
    return this._region().get('isFreeText');
  },

  _region: function() {
    return this.get('rows').at(1); // 2nd row
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
