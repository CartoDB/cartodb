var cdb = require('cartodb.js');
var pluralizeString = require('../../../view_helpers/pluralize_string');
var GeocodingResultDetailsView = require('./geocoding_result_details_view');

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

  initialize: function() {
    this.user = this.options.user;
    this._showSuccessDetailsButton = this.options.showSuccessDetailsButton;
    this.template = cdb.templates.getTemplate('common/background_polling/views/geocodings/background_geocoding_item');
    this._initBinds();
  },

  render: function() {
    var proccessedRows = this.model.get('processed_rows') || 0;
    var proccessableRows = this.model.get('processable_rows') || 0;
    var realRows = this.model.get('real_rows') || 0;

    var d = {
      realRows: realRows,
      tableName: this.model.get('table_name'),
      hasFailed: this.model.hasFailed(),
      hasCompleted: this.model.hasCompleted(),
      proccessedRows: proccessedRows,
      processableRows: proccessableRows,
      showSuccessDetailsButton: this._showSuccessDetailsButton,
      realRowsPluralize: pluralizeString('row', 'rows', this.model.get('real_rows')),
      processableRowsPluralize: pluralizeString('row', 'rows', proccessableRows),
      width: realRows > 0 ? (proccessableRows/realRows) : 100
    }
    this.$el.html(this.template(d));

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this._onStateChange, this);
    this.model.bind('change', this.render, this);
    this.model.bind('remove', this.clean, this);
  },

  _onStateChange: function() {
    if (this.model.hasCompleted()) {
      this.trigger('completed', this.model, this);
    }
  },

  _cancelGeocoding: function() {
    this.model.cancelGeocoding();
    this._removeItem();
  },

  _removeGeocoding: function() {
    this.trigger('remove', this.model, this);
    this.clean();
  },

  _showDetails: function() {
    new GeocodingResultDetailsView({
      clean_on_hide: true,
      user: this.user,
      model: this.model
    }).appendToBody();
  }

});
