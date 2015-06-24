var Backbone = require('backbone');
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

  defaults: {
    options: undefined // Collection, created with model
  },

  initialize: function(attrs) {
    // if (!attrs.table) throw new Error('table is required');
    this._initOptions();
  },

  changedSelectedTab: function(newTab) {
    this.get('options').chain()
      .without(newTab).each(this._deselect);
  },

  selectedTabModel: function() {
    return this.get('options').find(this._isSelected);
  },

  _isSelected: function(m) {
    return m.get('selected');
  },

  _deselect: function(m) {
    m.set('selected', false);
  },

  _initOptions: function() {
    var options = new Backbone.Collection([
      new LonLatColumnsModel({
        selected: true
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
