var Backbone = require('backbone');
var _ = require('underscore');
var cdb = require('cartodb.js');
var LonLatColumnsModel = require('./lon_lat_columns/lon_lat_columns_model');
var CityNamesModel = require('./city_names/city_names_model');
var AdminRegionsModel = require('./admin_regions/admin_regions_model');
var PostalCodesModel = require('./postal_codes/postal_codes_model');
var IpAddresses = require('./ip_addresses/ip_addresses_model');
var StreetAddressesModel = require('./street_addresses/street_addresses_model');

/**
 * View model for merge datasets view.
 */
module.exports = cdb.core.Model.extend({

  _EXCLUDED_COLUMN_NAMES: ['cartodb_id', 'the_geom', 'updated_at', 'created_at', 'cartodb_georef_status'],

  defaults: {
    options: undefined // Collection, created with model
  },

  initialize: function(attrs) {
    if (!attrs.table) throw new Error('table is required');
    this._initOptions();
  },

  changedSelectedTab: function(newTab) {
    this.get('options').chain()
      .without(newTab).each(this._deselect);
  },

  selectedTabModel: function() {
    return this.get('options').find(this._isSelected);
  },

  columnsNames: function() {
    return _.chain(this.get('table').get('schema'))
    .map(this._columnNameFromRawSchemaItem)
    .difference(this._EXCLUDED_COLUMN_NAMES)
    .value();
  },

  continue: function() {
    var tabModel = this.selectedTabModel();
    if (tabModel.get('canContinue')) {
      this.set('geocodeData', tabModel.geocodeData());
    }
  },

  _columnNameFromRawSchemaItem: function(rawColumn) {
    return rawColumn[0];
  },

  _isSelected: function(m) {
    return m.get('selected');
  },

  _deselect: function(m) {
    m.set('selected', false);
  },

  _initOptions: function() {
    var columnsNames = this.columnsNames();
    var options = new Backbone.Collection([
      new LonLatColumnsModel({
        selected: true,
        columnsNames: columnsNames
      }),
      new CityNamesModel(),
      new AdminRegionsModel(),
      new PostalCodesModel(),
      new IpAddresses(),
      new StreetAddressesModel()
    ]);
    this.set('options', options);
  }

});
