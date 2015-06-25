var cdb = require('cartodb.js');
var BaseDialog = require('../../../views/base_dialog/view');
var pluralizeString = require('../../../view_helpers/pluralize_string');
var Utils = require('cdb.Utils');

/**
 *  When a geocoding proccess finishes, this dialog displays
 *  all the info about the task (price, rows, errors, etc).
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog BackgroundPollingDetails GeocodingResultDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
  },

  render_content: function() {
    var processedRows = this.model.get('processed_rows') || 0;
    var processableRows = this.model.get('processable_rows') || 0;
    var realRows = this.model.get('real_rows') || 0;
    var googleUser = this.user.featureEnabled('google_maps');
    var price = (this.model.get('price')/100) || 0;
    var template = '';
    var error = this.model.get('error') || {};
    var geometryType = this.model.get('geometry_type') || 'point';
    var kind = this.model.get('kind');
    var remainingQuota = this.model.get('remaining_quota');
    var usedCredits = this.model.get('used_credits');
    var rowOrRows = function(count) { return pluralizeString(count, 'row', 'rows') };
    var datasetURL = '';

    // URL
    if (this.user && this.model.get('table_name')) {
      var vis = new cdb.admin.Visualization({
        type: 'table',
        table: {
          name: this.model.get('table_name')
        }
      });
      vis.permission.owner = this.user;
      datasetURL = encodeURI(vis.viewUrl(this.user).edit());  
    }

    // Select template
    if (this.model.hasCompleted()) {
      if (realRows === 0) {
        template = 'geocoding_no_result_details';
      } else {
        // Depending if the geocoder is high-resolution or not
        if (kind === "high-resolution") {
          template = 'geocoding_success_resolution_details';
        } else {
          template = 'geocoding_success_details';
        }
      }
    } else {
      template = 'geocoding_error_details';
    }

    var d = {
      id: this.model.get('id'),
      kind: this.model.get('kind'),
      usedCredits: usedCredits,
      usedCreditsFormatted: Utils.formatNumber(usedCredits),
      usedCreditsPluralize: pluralizeString('credit', 'credits', usedCredits),
      geometryTypePluralize: pluralizeString(geometryType, geometryType + 's', processableRows),
      geometryType: geometryType,
      remainingQuota: remainingQuota,
      remainingQuotaFormatted: Utils.formatNumber(remainingQuota),
      remainingQuotaPluralize: pluralizeString('token', 'tokens', remainingQuota),
      monthlyUse: this.user.get('geocoding').monthly_use,
      quota: this.user.get('geocoding').quota,
      blockPrice: this.user.get('geocoding').block_price,
      geocodingPrice: price,
      googleUser: googleUser,
      tableName: this.model.get('table_name'),
      state: this.model.get('state') || '',
      realRows: realRows,
      realRowsFormatted: Utils.formatNumber(realRows),
      realRowsPluralize: rowOrRows(realRows),
      processedRows: processedRows,
      processedRowsFormatted: Utils.formatNumber(processedRows),
      processedRowsPluralize: rowOrRows(processedRows),
      processableRows: processableRows,
      processableRowsFormatted: Utils.formatNumber(processableRows),
      processableRowsPluralize: rowOrRows(processableRows),
      price: price,
      priceFormatted: Utils.formatNumber(price),
      customHosted: cdb.config.get('custom_com_hosted'),
      errorTitle: error.title,
      errorDescription: error.description,
      showGeocodingDatasetURLButton: this.options.showGeocodingDatasetURLButton,
      datasetURL: datasetURL
    }

    return cdb.templates.getTemplate('common/background_polling/views/geocodings/' + template)(d);
  }

});
