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
      this.fetch({ success: this._downloadExport });
    }.bind(this), 2000);
  },

  _downloadExport: function() {
    clearInterval(this._pollPID);
  },

  _loadAttributes: function(attrs) {
    if (!attrs) throw new Error('no attributes were specified');

    if (attrs.visualization_id) this.visualization_id = attrs.visualization_id
    else throw new Error('\'visualization_id\' is required');
  }
});
