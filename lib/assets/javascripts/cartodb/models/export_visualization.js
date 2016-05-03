cdb.admin.ExportVisualization = cdb.core.Model.extend({
  /*
   * Creates an export_visualization job and polls until it finishes.
   * Results in zip download containing visualization metadata + data.
  */
  urlRoot: '/api/v3/visualization_exports',

  initialize: function(attrs) {
    this._loadAttributes(attrs);
  },

  requestExport: function() {
    this.save(null, { success: this._requestExportSuccessHandler.bind(this) });
  },

  _requestExportSuccessHandler: function() {
    this._pollPID = setInterval(function() {
      this.fetch({ success: this._checkState.bind(this), error: this._errorHandler.bind(this) });
    }.bind(this), 2000);
  },

  _checkState: function() {
    if      (this.get('state') === 'complete') this._downloadExport()
    else if (this.get('state') === 'failure')  throw new Error('Export has failed.')
  },

  _downloadExport: function() {
    clearInterval(this._pollPID);

    window.open(this.get('url'));
  },

  _loadAttributes: function(attrs) {
    if (!attrs) throw new Error('no attributes were specified');

    if (attrs.visualization_id) this.visualization_id = attrs.visualization_id
    else throw new Error('\'visualization_id\' is required');
  },

  _errorHandler: function() {
    clearInterval(this._pollPID);

    throw new Error('There is a problem with your connection. Please try again.');
  }
});
