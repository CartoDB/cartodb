cdb.admin.ExportMap = cdb.core.Model.extend({
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
    if      (this.get('state') === 'complete') this._finishExport()
    else if (this.get('state') === 'failure')  this._errorHandler();
  },

  _finishExport: function() {
    clearInterval(this._pollPID);

    this.url = this.get('url');

    var checkInterval;
    var w = window.open(url);
    w.onload = function() {
      clearInterval(checkInterval);
      var error = getError(w.document.body.textContent);
      if(error) {
        this.showError(error);
      } else {
        this.close();
      }
      w.close();
    }.bind(this);

    window.focus();
    checkInterval = setInterval(function check() {
      // safari needs to check the body because it never
      // calls onload
      if (w.closed || (w.document && w.document.body.textContent.length === 0)) {
        this.close();
        clearInterval(checkInterval);
      }
    }.bind(this), 100);
  },

  _errorHandler: function() {
    clearInterval(this._pollPID);

    throw new Error('There is a problem with your export. Please try again.');
  },

  _loadAttributes: function(attrs) {
    if (!attrs) throw new Error('no attributes were specified');

    if (attrs.visualization_id) this.visualization_id = attrs.visualization_id
    else throw new Error('\'visualization_id\' is required');
  }
});
