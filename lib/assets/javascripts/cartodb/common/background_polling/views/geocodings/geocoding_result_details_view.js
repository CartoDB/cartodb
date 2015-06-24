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
    var proccessedRows = this.model.get('processed_rows') || 0;
    var proccessableRows = this.model.get('processable_rows') || 0;
    var realRows = this.model.get('real_rows') || 0;
    var googleUser = this.user.featureEnabled('google_maps');
    var price = this.model.get('price');
    var template = '';
    var error = this.model.get('error') || {};

    // Select template
    if (this.model.hasCompleted()) {
      if (realRows === 0) {
        template = 'geocoding_no_result_details';
      } else {
        template = 'geocoding_success_details';
      }
    } else {
      template = 'geocoding_error_details';
    }

    var d = {
      id: this.model.get('id'),
      kind: this.model.get('kind'),
      realRows: realRows,
      geometryType: this.model.get('geometry_type'),
      remainingQuota: this.model.get('remaining_quota'),
      monthlyUse: this.user.get('geocoding').monthly_use,
      quota: this.user.get('geocoding').quota,
      blockPrice: this.user.get('geocoding').block_price,
      geocodingPrice: price,
      googleUser: googleUser,
      tableName: this.model.get('table_name'),
      state: this.model.get('state') || '',
      proccessedRows: proccessedRows,
      processableRows: proccessableRows,
      realRowsPluralize: pluralizeString('row', 'rows', realRows),
      proccessableRowsPluralize: pluralizeString('row', 'rows', proccessableRows),
      customHosted: cdb.config.get('custom_com_hosted'),
      errorTitle: error.title,
      errorDescription: error.description
    }
    return cdb.templates.getTemplate('common/background_polling/views/geocodings/' + template)(d);
  }

});
