var Backbone = require('backbone');
var _ = require('underscore');
var cdb = require('cartodb.js');
var LonLatColumnsModel = require('./lon_lat_columns/lon_lat_columns_model');
var CityNamesModel = require('./city_names/city_names_model');
var AdminRegionsModel = require('./admin_regions/admin_regions_model');
var PostalCodesModel = require('./postal_codes/postal_codes_model');
var IpAddressesModel = require('./ip_addresses/ip_addresses_model');
var StreetAddressesModel = require('./street_addresses/street_addresses_model');
var GeocodeStuff = require('./geocode_stuff');

/**
 * View model for merge datasets view.
 */
module.exports = cdb.core.Model.extend({

  _EXCLUDED_COLUMN_NAMES: ['cartodb_id', 'the_geom', 'updated_at', 'created_at', 'cartodb_georef_status'],
  _ALLOWED_COLUMN_TYPES: ['string', 'number', 'boolean', 'date'],

  _TEXTS: {
    georef_disabled: "You don't have this option available in this version"
  },

  defaults: {
    options: undefined // Collection, created with model
  },

  initialize: function(attrs) {
    if (!attrs.table) throw new Error('table is required');
    if (!attrs.user) throw new Error('user is required');
    this._initOptions();
  },

  changedSelectedTab: function(newTab) {
    this.get('options').chain()
      .without(newTab).each(this._deselect);
  },

  createView: function() {
    return this._selectedTabModel().createView();
  },

  canContinue: function() {
    return this._selectedTabModel().get('canContinue');
  },

  continue: function() {
    if (this.canContinue()) {
      this._selectedTabModel().continue();
    }
  },

  canGoBack: function() {
    return this._selectedTabModel().get('canGoBack');
  },

  goBack: function() {
    if (this.canGoBack()) {
      this._selectedTabModel().goBack();
    }
  },

  updateAvailableGeometriesFetchData: function() {
    this._selectedTabModel().updateAvailableGeometriesFetchData(this.get('table').get('id'));
    location = m.get('location');

    var d = {
      kind: m.kind
    };
    var location = this.get('location');

    m.set('availableGeometriesFetchData', {
      kind: m.kind,
    });
  },

  _selectedTabModel: function() {
    return this.get('options').find(this._isSelected);
  },

  _columnsNames: function() {
    // Maintained old logic, so for some reason the column types filter is not applied for the places where the column names are usd
    return _.chain(this.get('table').get('schema'))
      .filter(this._isAllowedColumnName, this)
      .map(this._columnName)
      .value();
  },

  _filteredColumns: function() {
    var table = this.get('table');
    // original_schema may be set if not in SQL view (see where attr is set in the table model)
    // maintained from code to not break behavior when implementing this new modal
    return _.chain(table.get('original_schema') || table.get('schema'))
      .filter(this._isAllowedColumnName, this)
      .filter(this._isAllowedColumnType, this)
      .map(this._inverColumnRawValues)
      .value();
  },

  _inverColumnRawValues: function(rawColumn) {
    // The cdb.forms.CustomTextCombo expects the data to be in order of [type, name], so need to translate the raw schema
    var type = rawColumn[1];
    var name = rawColumn[0];
    return [type, name];
  },

  _isAllowedColumnName: function(rawColumn) {
    return !_.contains(this._EXCLUDED_COLUMN_NAMES, this._columnName(rawColumn));
  },

  _isAllowedColumnType: function(rawColumn) {
    return _.contains(this._ALLOWED_COLUMN_TYPES, this._columnType(rawColumn));
  },

  _columnName: function(rawColumn) {
    return rawColumn[0];
  },

  _columnType: function(rawColumn) {
    return rawColumn[1];
  },

  _isSelected: function(m) {
    return m.get('selected');
  },

  _deselect: function(m) {
    m.set('selected', false);
  },

  _initOptions: function() {
    var geocodeStuff = new GeocodeStuff(this.get('table').get('id'));
    var columnsNames = this._columnsNames();
    var columns = this._filteredColumns();

    var options = new Backbone.Collection([
      new LonLatColumnsModel({
        geocodeStuff: geocodeStuff,
        columnsNames: columnsNames,
        selected: true
      }),
      new CityNamesModel({
        geocodeStuff: geocodeStuff,
        columnsNames: columnsNames,
        columns: columns
      }),
      new AdminRegionsModel({
        geocodeStuff: geocodeStuff,
        columnsNames: columnsNames,
        columns: columns
      }),
      new PostalCodesModel({
        geocodeStuff: geocodeStuff,
        columnsNames: columnsNames,
        columns: columns
      }),
      new IpAddressesModel({
        geocodeStuff: geocodeStuff,
        columnsNames: columnsNames,
        columns: columns
      }),
      new StreetAddressesModel({
      })
    ]);

    if (this.get('user').featureEnabled('georef_disabled')) {
      options.chain()
        .rest() // exclude 1st tab (LonLat), since it should not be affected by this feature flag
        .each(this._disableTab.bind(this, this._TEXTS.georef_disabled));
    }

    this.set('options', options);
  },

  _disableTab: function(msg, tabModel) {
    tabModel.set('disabled', msg);
  }

});
