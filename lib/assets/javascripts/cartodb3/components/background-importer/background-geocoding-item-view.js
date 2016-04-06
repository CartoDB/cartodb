var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var Utils = require('cdb.Utils');
var pluralizeString = require('../../helpers/pluralize-string');
var GeocodingResultDetailsView = require('../geocoding/geocoding-result-details-view');
var template = require('./background-geocoding-item.tpl');

/**
 *  Geocoding item within background polling
 *
 */
module.exports = cdb.core.View.extend({

  className: 'ImportItem',
  tagName: 'li',

  events: {
    'click .js-abort': '_cancelGeocoding',
    'click .js-info': '_showDetails',
    'click .js-close': '_removeGeocoding'
  },

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    this._userModel = opts.userModel;

    this._initBinds();
  },

  render: function () {
    var processedRows = this.model.get('processed_rows') || 0;
    var processableRows = this.model.get('processable_rows') || 0;
    var realRows = this.model.get('real_rows') || 0;
    var isLatLngType = this.model.get('latitude_column') && this.model.get('longitude_column');

    var d = {
      realRows: realRows,
      tableName: this.model.get('table_name'),
      canCancel: _.isFunction(this.model.cancelGeocoding),
      hasFailed: this.model.hasFailed(),
      hasCompleted: this.model.hasCompleted(),
      processedRows: processedRows,
      processableRows: processableRows,
      processableRowsFormatted: Utils.formatNumber(processableRows),
      realRowsPluralize: pluralizeString('row', 'rows', this.model.get('real_rows')),
      realRowsFormatted: Utils.formatNumber(realRows),
      processableRowsPluralize: pluralizeString('row', 'rows', processableRows),
      width: realRows > 0 ? (processableRows / realRows) : 100,
      isLatLngType: isLatLngType
    };

    this.$el.html(template(d));

    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
    this.model.bind('remove', this.clean, this);
  },

  _cancelGeocoding: function () {
    this.model.cancelGeocoding();
  },

  _removeGeocoding: function () {
    this.trigger('remove', this.model, this);
    this.clean();
  },

  _showDetails: function () {
    new GeocodingResultDetailsView({
      clean_on_hide: true,
      userModel: this._userModel,
      model: this.model,
      showGeocodingDatasetURLButton: this.options.showGeocodingDatasetURLButton
    }).appendToBody();
  }
});
