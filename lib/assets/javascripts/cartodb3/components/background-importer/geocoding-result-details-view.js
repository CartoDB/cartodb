var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../../views/base_dialog/view');
var pluralizeString = require('../../../view_helpers/pluralize_string');
var Utils = require('cdb.Utils');

/**
 *  When a geocoding proccess finishes, this dialog displays
 *  all the info about the task (price, rows, errors, etc).
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog BackgroundPollingDetails is-opening',

  initialize: function () {
    this.elder('initialize');
    this.user = this.options.user;
  },

  render_content: function () {
    var error = this.model.get('error') || {};

    var processedRows = this.model.get('processed_rows') || 0;
    var processableRows = this.model.get('processable_rows') || 0;
    var realRows = this.model.get('real_rows') || 0;
    var geometryType = this.model.get('geometry_type') || 'point';

    // Related to price and credits
    var price = this.model.get('price');
    var hasPrice = price !== undefined && price !== null;
    var googleUser = this.user.featureEnabled('google_maps');

    var datasetURL;

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
    var template = 'common/background_polling/views/geocodings/';
    if (this.model.hasCompleted()) {
      template += realRows === 0 ? 'geocoding_no_result_details' : 'geocoding_success_details';
    } else {
      template += 'geocoding_error_details';
    }

    return cdb.templates.getTemplate(template)({
      id: this.model.get('id'),
      geometryTypePluralize: pluralizeString(geometryType, geometryType + 's', processableRows),
      geometryType: geometryType,
      remainingQuotaFormatted: Utils.formatNumber(this.model.get('remaining_quota')),
      googleUser: googleUser,
      tableName: this.model.get('table_name'),
      state: this.model.get('state') || '',
      blockPrice: this.user.get('geocoding').block_price,
      realRows: realRows,
      realRowsFormatted: Utils.formatNumber(realRows),
      processedRows: processedRows,
      processableRows: processableRows,
      processableRowsFormatted: Utils.formatNumber(processableRows),
      hasPrice: hasPrice,
      price: price,
      customHosted: cdb.config.get('cartodb_com_hosted'),
      errorDescription: error.description,
      showGeocodingDatasetURLButton: this.options.showGeocodingDatasetURLButton && datasetURL,
      datasetURL: datasetURL
    });
  }

});
