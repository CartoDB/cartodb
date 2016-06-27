var Backbone = require('backbone');
var cdb = require('cartodb.js-v3');
var Utils = require('../../helpers/utils');

/**
 *  When a geocoding proccess finishes, this dialog displays
 *  all the info about the task (price, rows, errors, etc).
 *
 */
module.exports = Backbone.View.extend({

  className: 'Dialog BackgroundPollingDetails is-opening',

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts._configModel;
  },

  render_content: function () {
    var error = this.model.get('error') || {};

    var processedRows = this.model.get('processed_rows') || 0;
    var processableRows = this.model.get('processable_rows') || 0;
    var realRows = this.model.get('real_rows') || 0;

    // Related to price and credits
    var price = this.model.get('price');
    var hasPrice = price !== undefined && price !== null;
    var googleUser = this._userModel.featureEnabled('google_maps');

    var datasetURL;

    if (this._userModel && this.model.get('table_name')) {
      var vis = new cdb.admin.Visualization({
        type: 'table',
        table: {
          name: this.model.get('table_name')
        }
      });
      vis.permission.owner = this._userModel;
      datasetURL = encodeURI(vis.viewUrl(this._userModel).edit());
    }

    var template = './geocoding/';
    if (this.model.hasCompleted()) {
      template += realRows === 0 ? 'geocoding-no-result-details' : 'geocoding-success-details';
    } else {
      template += 'geocoding-error-details';
    }

    return cdb.templates.getTemplate(template)({
      id: this.model.get('id'),
      geometryType: this.model.get('geometry_type') || 'point',
      remainingQuotaFormatted: Utils.formatNumber(this.model.get('remaining_quota')),
      googleUser: googleUser,
      tableName: this.model.get('table_name'),
      state: this.model.get('state') || '',
      blockPrice: this._userModel.get('geocoding').block_price,
      realRows: realRows,
      realRowsFormatted: Utils.formatNumber(realRows),
      processedRows: processedRows,
      processableRows: processableRows,
      processableRowsFormatted: Utils.formatNumber(processableRows),
      hasPrice: hasPrice,
      price: price,
      customHosted: this._configModel.get('cartodb_com_hosted'),
      errorDescription: error.description,
      showGeocodingDatasetURLButton: this.options.showGeocodingDatasetURLButton && datasetURL,
      datasetURL: datasetURL
    });
  }
});
