var Backbone = require('backbone-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var LonLatColumnsModel = require('./lon_lat_columns_model');
var CityNamesModel = require('./city_names_model');
var AdminRegionsModel = require('./admin_regions_model');
var PostalCodesModel = require('./postal_codes_model');
var IpAddressesModel = require('./ip_addresses_model');
var StreetAddressesModel = require('./street_addresses/street_addresses_model');
var GeocodeStuffModel = require('./geocode_stuff_model');
var UserGeocodingModel = require('./user_geocoding_model');

/**
 * View model for merge datasets view.
 */
module.exports = cdb.core.Model.extend({

  _EXCLUDED_COLUMN_NAMES: ['cartodb_id', 'the_geom', 'updated_at', 'created_at', 'cartodb_georef_status'],
  _ALLOWED_COLUMN_TYPES: ['string', 'number', 'boolean', 'date'],

  defaults: {
    options: undefined // Collection, created with model
  },

  initialize: function(attrs) {
    if (!attrs.table) throw new Error('table is required');
    if (!attrs.user) throw new Error('user is required');
    this._initGeocodeStuff();
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

  _initGeocodeStuff: function() {
    var m = new GeocodeStuffModel({
      tableName: this.get('table').get('id')
    });
    this.set('geocodeStuff', m);
  },

  _initOptions: function() {
    var geocodeStuff = this.get('geocodeStuff');
    var columnsNames = this._columnsNames();
    var columns = this._filteredColumns();

    this.set('options',
      new Backbone.Collection([
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
          geocodeStuff: geocodeStuff,
          columns: columns,
          isGoogleMapsUser: this._isGmeGeocoderEnabled(),
          userGeocoding: this._userGeocoding(),
          lastBillingDate: this.get('user').get('billing_period'),
          estimation: new cdb.admin.Geocodings.Estimation({
            id: this.get('table').getUnquotedName()
          })
        })
      ])
    );

    if (this.get('user').featureEnabled('georef_disabled')) {
      this._disableGeorefTabs();
    } else {
      this._maybeDisabledStreetAddresses();
    }
  },

  _disableGeorefTabs: function() {
    _.each(this._georefTabs(), this._disableTab.bind(this, "You don't have this option available in this version"));
  },

  _georefTabs: function() {
     // exclude 1st tab (LonLat), since it should not be affected by this feature flag
    return this.get('options').rest();
  },

  _maybeDisabledStreetAddresses: function() {
    var isGmeGeocoderEnabled = this._isGmeGeocoderEnabled();
    if (this._isGoogleMapsEnabled()) {
      if (!isGmeGeocoderEnabled) {
        this._disableTab('Google Maps geocoder is not configured. Please contact us at sales@carto.com', this._streetAddrTabModel());
      }
    } else {
      if (isGmeGeocoderEnabled) {
        this._disableTab('Geocoder is not configured properly. Please contact us at sales@carto.com', this._streetAddrTabModel());
      } else if (!this._userGeocoding().hasQuota()) {
        // Credits are only used for users that use non-GME geocoder
        this._disableTab('Your geocoding quota is not defined. Please contact us at sales@carto.com', this._streetAddrTabModel());
      }
    }
  },

  _userGeocoding: function() {
    return new UserGeocodingModel(this.get('user').get('geocoding'));
  },

  _isGoogleMapsEnabled: function() {
    return this._hasUserActionEnabled('google_maps_enabled');
  },

  _isGmeGeocoderEnabled: function() {
    return this._hasUserActionEnabled('google_maps_geocoder_enabled');
  },

  _hasUserActionEnabled: function(actionName) {
    return !!this.get('user').get('actions')[actionName];
  },

  _streetAddrTabModel: function() {
    return this.get('options').find(function(m) {
      return m instanceof StreetAddressesModel;
    });
  },

  _disableTab: function(msg, tabModel) {
    tabModel.set('disabled', msg);
  }

});
