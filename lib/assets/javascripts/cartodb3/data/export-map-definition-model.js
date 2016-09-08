var Backbone = require('backbone');

/**
 * Model that represents a visualization export (v3)
 */

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!attrs.visualization_id) throw new Error('visualization_id is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');

    return baseUrl + '/api/v3/visualization_exports';
  },

  requestExport: function () {
    this.save(null, {
      success: this._requestExportSuccessHandler.bind(this)
    });

    // TODO add metrics for private and public exports
  },

  cancelExport: function () {
    this._interrupt();
  },

  _requestExportSuccessHandler: function () {
    this._pollPID = setInterval(function () {
      this.fetch({
        success: this._checkState.bind(this),
        error: this._errorHandler.bind(this)
      });
    }.bind(this), 2000);
  },

  _checkState: function () {
    if (this.get('state') === 'complete') {
      this._finishExport();
    } else if (this.get('state') === 'failure') {
      this._errorHandler();
    }
  },

  _finishExport: function () {
    clearInterval(this._pollPID);
  },

  _errorHandler: function () {
    this._interrupt();

    throw new Error('There is a problem with your export. Please try again.');
  },

  _interrupt: function () {
    clearInterval(this._pollPID);

    this.set('state', 'failure');
  }
});
