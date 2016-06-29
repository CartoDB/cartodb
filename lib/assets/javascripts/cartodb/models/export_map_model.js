/* global cdb */

cdb.admin.ExportMapModel = cdb.core.Model.extend({
  /*
   * Creates an export_visualization job and polls until it finishes.
   * Results in zip download containing visualization metadata + data.
  */
  urlRoot: '/api/v3/visualization_exports',

  initialize: function (attrs) {
    this._loadAttributes(attrs);
  },

  requestExport: function () {
    this.save(null, { success: this._requestExportSuccessHandler.bind(this) });

    if (window.user_data && window.user_data.email) {
      cdb.god.trigger('metrics', 'export_map', {
        email: window.user_data.email
      });
    } else {
      cdb.god.trigger('metrics', 'export_map_public', {});
    }
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
  },

  _loadAttributes: function (attrs) {
    if (!attrs) throw new Error('no attributes were specified');

    if (!attrs.visualization_id) throw new Error('\'visualization_id\' is required');

    this.visualization_id = attrs.visualization_id;
  }
});
