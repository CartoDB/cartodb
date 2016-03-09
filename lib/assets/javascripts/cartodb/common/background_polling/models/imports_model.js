var cdb = require('cartodb.js');
var _ = require('underscore');
var ImportModel = require('./import_model');
var UploadModel = require('./upload_model');

/**
 *  Upload/import model
 *
 *  It takes the control of the upload and import,
 *  listening the change of any of these steps.
 *
 *  Steps:
 *  - upload
 *  - import
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    step: 'upload',
    state: ''
  },

  initialize: function(attrs, opts) {
    if (_.isEmpty(opts)) opts = {};
    this.user = opts && opts.user;
    this.upl = new UploadModel(opts.upload, { user: this.user });
    this.imp = new ImportModel(opts.import);
    this._initBinds();
    this._checkStatus();
  },

  _initBinds: function() {
    this.bind('change:import',  this._onImportChange, this);
    this.bind('change:upload',  this._onUploadChange, this);
    this.bind('change:id',      this._onIdChange, this);

    this.imp.bind('change', function() {
      this.trigger('change:import');
      this.trigger('change');
    }, this);
    this.upl.bind('change', function() {
      this.trigger('change:upload');
      this.trigger('change');
    }, this)
  },

  _destroyBinds: function() {
    this.upl.unbind(null, null, this);
    this.imp.unbind(null, null, this);
  },

  _onIdChange: function() {
    var item_queue_id = this.get('id');
    if (item_queue_id) this.imp.set('item_queue_id', item_queue_id);
    this.set('step', 'import');
  },

  _onUploadChange: function(m, i) {
    if (this.get('step') === "upload") {
      var item_queue_id = this.upl.get('item_queue_id');
      var state = this.upl.get('state');

      if (item_queue_id) this.set('id', item_queue_id);
      if (state) this.set('state', state);
    }
  },

  _onImportChange: function() {
    if (this.get('step') === "import") {
      var state = this.imp.get('state');
      if (state) this.set('state', state);
    }
  },

  _checkStatus: function() {
    if (!this.get('id') && !this.upl.isValid()) {
      this.trigger('change:upload');
      return;
    }

    if (this.upl.get('type') === 'file') {
      this.upl.upload();
    } else if (this.get('id')) {
      this.set('step', 'import');
      this.imp.set('item_queue_id', this.get('id'));
    } else if (!this.imp.get('item_queue_id') && this.upl.get('type') !== "") {
      this.set('step', 'import');
      this.imp.createImport(this.upl.toJSON());
    }
  },

  cancel: function() {
    // send update PUT to import job, which will cancel it
    if (this.get('step') === "import") {
      this.imp.save();
    } else {
      this.stopUpload();
      this.stopImport();
    }
  },

  pause: function() {
    this.stopUpload();
    this.stopImport();
  },

  cancelled: function() {
    return this.get('state') === 'cancelled';
  },

  hasFailed: function() {
    var state = this.get('state');
    var step = this.get('step');

    return ( step === 'import' && state === 'failure' ) || ( step === 'upload' && state === 'error' );
  },

  hasCompleted: function() {
    return this.get('step') === "import" && this.imp && this.imp.get('state') === 'complete'
  },

  getWarnings: function() {
    var step = this.get('step');

    return step === 'import' ? this.imp.get('warnings') : '';
  },

  getError: function() {
    if (this.hasFailed()) {
      var step = this.get('step');
      return _.extend(
        {
          error_code: this[step === "upload" ? 'upl' : 'imp'].get('error_code'),
          item_queue_id: step === "import" ? this.imp.get('id') : '',
          original_url: step === "import" ? this.imp.get('original_url') : '',
          data_type: step === "import" ? this.imp.get('data_type') : '',
          http_response_code: step === "import" ? this.imp.get('http_response_code') : '',
          http_response_code_message: step === "import" ? this.imp.get('http_response_code_message') : ''
        }
        ,
        this[step === "upload" ? 'upl' : 'imp'].get('get_error_text')
      )
    }

    return {
      title: '',
      what_about: '',
      error_code: ''
    }
  },

  importedVis: function() {
    if (this.get('import').derived_visualization_id) {
      return this._getMapVis();
    } else {
      return this._getDatasetVis();
    }
  },

  _getMapVis: function() {
    var derivedVisId = this.imp.get('derived_visualization_id');

    if (!derivedVisId) {
      return false;
    }

    return this._createVis({
      type: 'derived',
      id: derivedVisId
    });
  },

  _getDatasetVis: function() {
    var tableName = this.imp.get('table_name');

    if (!tableName) {
      return false;
    }

    return this._createVis({
      type: 'table',
      table: {
        name: tableName
      }
    });
  },

  _createVis: function(attrs) {
    var vis = new cdb.admin.Visualization(attrs);
    vis.permission.owner = this.user;
    return vis;
  },

  setError: function(opts) {
    var step = this.get('step');
    var stepModel = this[ step === "upload" ? 'upl' : 'imp' ];

    this.stopUpload();
    this.stopImport();

    stepModel.set(opts);

    this.set('state', 'error');
  },

  stopUpload: function() {
    this.upl.stopUpload();
  },

  stopImport: function() {
    this.imp.destroyCheck();
  },

  get: function (attr) {
    if (attr === "upload") return this.upl.toJSON();
    if (attr === "import") return this.imp.toJSON();

    return cdb.core.Model.prototype.get.call(this, attr);
  },

  toJSON: function() {
    return {
      step: this.get('step'),
      id: this.get('id'),
      state: this.get('state'),
      upload: this.upl.toJSON(),
      import: this.imp.toJSON()
    }
  }

});
