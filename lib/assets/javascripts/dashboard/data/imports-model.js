// TODO: Hacer un extend del archivo de builder
var _ = require('underscore');
var Backbone = require('backbone');
var ImportModel = require('builder/data/background-importer/import-model');
var UploadModel = require('dashboard/data/upload-model');
var VisualizationModel = require('dashboard/data/visualization-model');
var PermissionModel = require('dashboard/data/permission-model');

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

module.exports = Backbone.Model.extend({

  defaults: {
    step: 'upload',
    state: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;

    this._uploadModel = new UploadModel(opts.upload, {
      userModel: this._userModel,
      configModel: this._configModel
    });

    if (_.isEmpty(opts)) {
      opts = {};
    }

    this._importModel = new ImportModel(opts.import, {
      configModel: this._configModel
    });
    this._initBinds();
    this._checkStatus();
  },

  _initBinds: function () {
    this.bind('change:import', this._onImportChange, this);
    this.bind('change:upload', this._onUploadChange, this);
    this.bind('change:id', this._onIdChange, this);

    this._importModel.bind('change', function () {
      this.trigger('change:import', this);
      this.trigger('change', this);
    }, this);

    this._uploadModel.bind('change', function () {
      this.trigger('change:upload', this);
      this.trigger('change', this);
    }, this);
  },

  _destroyBinds: function () {
    this._uploadModel.unbind(null, null, this);
    this._importModel.unbind(null, null, this);
  },

  _onIdChange: function () {
    var item_queue_id = this.get('id');
    if (item_queue_id) this._importModel.set('item_queue_id', item_queue_id);
    this.set('step', 'import');
  },

  _onUploadChange: function (m, i) {
    if (this.get('step') === 'upload') {
      var item_queue_id = this._uploadModel.get('item_queue_id');
      var state = this._uploadModel.get('state');

      if (item_queue_id) this.set('id', item_queue_id);
      if (state) this.set('state', state);
    }
  },

  _onImportChange: function () {
    if (this.get('step') === 'import') {
      var state = this._importModel.get('state');
      if (state) this.set('state', state);
    }
  },

  _checkStatus: function () {
    if (!this.get('id') && !this._uploadModel.isValid()) {
      this.trigger('change:upload');
      return;
    }

    if (this._uploadModel.get('type') === 'file') {
      this._uploadModel.upload();
    } else if (this.get('id')) {
      this.set('step', 'import');
      this._importModel.set('item_queue_id', this.get('id'));
    } else if (!this._importModel.get('item_queue_id') && this._uploadModel.get('type') !== '') {
      this.set('step', 'import');
      this._importModel.createImport(this._uploadModel.toJSON());
    }
  },

  getImportModel: function () {
    return this._importModel;
  },

  pause: function () {
    this.stopUpload();
    this.stopImport();
  },

  hasFailed: function () {
    var state = this.get('state');
    var step = this.get('step');

    return (step === 'import' && state === 'failure') || (step === 'upload' && state === 'error');
  },

  hasCompleted: function () {
    return this.get('step') === 'import' && this._importModel && this._importModel.get('state') === 'complete';
  },

  getWarnings: function () {
    return this.get('step') === 'import' ? this._importModel.get('warnings') : '';
  },

  getError: function () {
    if (this.hasFailed()) {
      var step = this.get('step');
      return _.extend(
        {
          errorCode: this[step === 'upload' ? '_uploadModel' : '_importModel'].get('error_code'),
          itemQueueId: step === 'import' ? this._importModel.get('id') : '',
          originalUrl: step === 'import' ? this._importModel.get('original_url') : '',
          dataType: step === 'import' ? this._importModel.get('data_type') : '',
          httpResponseCode: step === 'import' ? this._importModel.get('http_response_code') : '',
          httpResponseCodeMessage: step === 'import' ? this._importModel.get('http_response_code_message') : ''
        },
        this[step === 'upload' ? '_uploadModel' : '_importModel'].get('get_error_text'));
    }

    return {
      title: '',
      what_about: '',
      error_code: ''
    };
  },

  importedVis: function () {
    if (this.get('import').derived_visualization_id) {
      return this._getMapVis();
    } else {
      return this._getDatasetVis();
    }
  },

  getNumberOfTablesCreated: function () {
    return this._importModel.get('tables_created_count');
  },

  _getServiceName: function () {
    return this._importModel.get('service_name');
  },

  isTwitterImport: function () {
    return this._getServiceName() === 'twitter_search';
  },

  isCartoImport: function () {
    return this._getDisplayName() && this._getDisplayName().match(/\.carto$/i);
  },

  _getDisplayName: function () {
    return this._importModel.get('display_name');
  },

  _getMapVis: function () {
    var derivedVisId = this._importModel.get('derived_visualization_id');

    if (!derivedVisId) {
      return false;
    }

    return this._createVis({
      type: 'derived',
      id: derivedVisId
    });
  },

  _getDatasetVis: function () {
    var tableName = this._importModel.get('table_name');

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

  _createVis: function (attrs) {
    var vis = new VisualizationModel(attrs, {
      configModel: this._configModel
    });

    vis.permission = new PermissionModel({
      owner: this._userModel.attributes
    }, {
      configModel: this._configModel,
      userModel: this._userModel
    });

    return vis;
  },

  setError: function (opts) {
    var stepModel = this[this.get('step') === 'upload' ? '_uploadModel' : '_importModel'];

    this.stopUpload();
    this.stopImport();

    stepModel.set(opts);

    this.set('state', 'error');
  },

  stopUpload: function () {
    this._uploadModel.stopUpload();
  },

  stopImport: function () {
    this._importModel.destroyCheck();
  },

  get: function (attr) {
    if (attr === 'upload') {
      return this._uploadModel.toJSON();
    }

    if (attr === 'import') {
      return this._importModel.toJSON();
    }

    return Backbone.Model.prototype.get.call(this, attr);
  },

  getRedirectUrl: function (user) {
    var vis = this.importedVis();
    if (vis) {
      return encodeURI(vis.viewUrl(user).edit());
    }
  },

  toJSON: function () {
    return {
      step: this.get('step'),
      id: this.get('id'),
      state: this.get('state'),
      upload: this._uploadModel.toJSON(),
      import: this._importModel.toJSON()
    };
  }
});
