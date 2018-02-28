var CoreView = require('backbone/core-view');
var Notifier = require('builder/components/notifier/notifier');
var UploadConfig = require('builder/config/upload-config');
var ErrorDetailsView = require('./error-details-view');
var WarningsDetailsView = require('./warnings-details-view');
var TwitterImportDetailsDialog = require('./twitter-import-details-view');

/**
 *  Import item within background importer
 *
 */

var DELEGATIONS = {
  loading: require('./delegated-import-views/loading'),
  error: require('./delegated-import-views/failed'),
  warning: require('./delegated-import-views/warnings'),
  success: require('./delegated-import-views/success')
};

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.importModel) throw new Error('importModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._modals = opts.modals;
    this._importModel = opts.importModel;
    this._showSuccessDetailsButton = opts.showSuccessDetailsButton;

    this._notification = Notifier.addNotification({});

    this._initBinds();
  },

  _initBinds: function () {
    this._importModel.on('change', this.updateNotification, this);
    this._importModel.on('remove', this.clean, this);
    this._notification.on('notification:close', this._closeHandler, this);
    this._notification.on('notification:action', this._actionHandler, this);
    this.add_related_model(this._importModel);
    this.add_related_model(this._notification);
  },

  _closeHandler: function () {
    this.trigger('remove', this._importModel, this);
    this._importModel.pause();
    this.clean();
  },

  _actionHandler: function (action) {
    if (action === 'show_errors') {
      this._showImportError();
    } else if (action === 'show_stats') {
      this._showImportStats();
    } else if (action === 'show_table') {
      this._showImportDataset();
    } else if (action === 'show_warnings') {
      this._showImportWarnings();
    }
  },

  _getStatus: function () {
    var status = 'loading';
    var failed = this._importModel.hasFailed();
    var completed = this._importModel.hasCompleted();
    var warnings = this._importModel.getWarnings();

    if (failed) {
      status = 'error';
    } else if (completed && !warnings) {
      status = 'success';
    } else if (completed && warnings) {
      status = 'warning';
    }

    return status;
  },

  _getInfo: function () {
    var upload = this._importModel.get('upload');
    var imp = this._importModel.get('import');

    var d = {
      name: '',
      state: this._importModel.get('state'),
      progress: '',
      service: '',
      step: this._importModel.get('step'),
      failed: this._importModel.hasFailed(),
      completed: this._importModel.hasCompleted(),
      warnings: this._importModel.getWarnings(),
      showSuccessDetailsButton: this._showSuccessDetailsButton,
      tables_created_count: imp.tables_created_count
    };

    // Name
    if (upload.type) {
      if (upload.type === 'file') {
        if (upload.value.length > 1) {
          d.name = upload.value.length + ' files';
        } else {
          d.name = upload.value.name;
        }
      }
      if (upload.type === 'url' || upload.type === 'remote') {
        d.name = upload.value;
      }
      if (upload.type === 'service') {
        d.name = upload.value && upload.value.filename || '';
      }
      if (upload.service_name === 'twitter_search') {
        d.name = 'Twitter import';
      }
      if (upload.type === 'sql') {
        d.name = 'SQL';
      }
      if (upload.type === 'duplication') {
        d.name = upload.table_name || upload.value;
      }
    } else {
      d.name = imp.display_name || imp.item_queue_id || 'import';
    }

    // Service
    d.service = upload.service_name;

    // Progress
    if (this._importModel.get('step') === 'upload') {
      d.progress = this._importModel.get('upload').progress;
    } else {
      d.progress = Math.max(0, (UploadConfig.uploadStates.indexOf(d.state) / UploadConfig.uploadStates.length) * 100);
    }

    d.progress = d.progress.toFixed(0);

    return d;
  },

  updateNotification: function () {
    var status = this._getStatus();
    var delegated = DELEGATIONS[status];
    delegated.call(this, this._importModel, this._notification, status, this._getInfo(), this._showSuccessDetailsButton);
  },

  _showImportDataset: function () {
    var dataset = this._importModel.get('import').table_name;
    window.location = this._configModel.get('base_url') + '/dataset/' + dataset;
  },

  _showImportStats: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      return new TwitterImportDetailsDialog({
        modalModel: modalModel,
        userModel: self._userModel,
        model: self._importModel
      });
    });
  },

  _showImportError: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      return new ErrorDetailsView({
        configModel: self._configModel,
        modalModel: modalModel,
        error: self._importModel.getError(),
        userModel: self._userModel
      });
    });
  },

  _showImportWarnings: function () {
    var self = this;
    this._modals.create(function (modalModel) {
      return new WarningsDetailsView({
        modalModel: modalModel,
        warnings: self._importModel.getWarnings(),
        userModel: self._userModel
      });
    });
  }
});
