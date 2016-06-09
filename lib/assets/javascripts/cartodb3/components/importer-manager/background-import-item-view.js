var CoreView = require('backbone/core-view');
var template = require('./background-import-item.tpl');
var Notifier = require('../../editor/components/notifier/notifier');
var UploadConfig = require('../../config/upload-config');
var ErrorDetailsView = require('./error-details-view');
var WarningsDetailsView = require('./warnings-details-view');
var TwitterImportDetailsDialog = require('./twitter-import-details-view');

/**
 *  Import item within background importer
 *
 */

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
    this._importModel.bind('change', this.updateNotification, this);
    this._importModel.bind('remove', this.clean, this);
    this._notification.on('notification:close', this._closeHandler, this);
    this._notification.on('notification:action', this._actionHandler, this);
    this.add_related_model(this._importModel);
    this.add_related_model(this._notification);
  },

  _closeHandler: function () {
    this.trigger('remove', this.model, this);
    this._importModel.pause();
    Notifier.removeNotification(this._notification);
    this.clean();
  },

  _actionHandler: function () {
    var failed = this._importModel.hasFailed();
    var completed = this._importModel.hasCompleted();
    var warnings = this._importModel.getWarnings();

    if (failed) {
      this._showImportError();
    } else if (completed && !warnings) {
      this._showImportStats();
    } else if (completed && warnings) {
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
      status = 'error';
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
      url: '',
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
      d.progress = (UploadConfig.uploadStates.indexOf(d.state) / UploadConfig.uploadStates.length) * 100;
    }

    d.progress = d.progress.toFixed(2);

    if (d.progress > 30) {
      debugger;
    }

    return template(d);
  },

  _getClosable: function () {
    var state = this._importModel.get('state');
    var step = this._importModel.get('step');
    var status = this._getStatus();

    if (status !== 'loading') {
      return true;
    } else {
      return state === 'uploading' && step === 'upload';
    }
  },

  _getButton: function () {
    var failed = this._importModel.hasFailed();
    var completed = this._importModel.hasCompleted();
    var warnings = this._importModel.getWarnings();
    var service = this._importModel.get('upload').service_name;
    var tables_created_count = this._importModel.get('import').tables_created_count;

    if (failed) {
      return _t('components.background-importer.background-importer-item.show');
    } else if (completed && !warnings) {
      if (this._showSuccessDetailsButton) {
        if (service && service === 'twitter_search') {
          return _t('components.background-importer.background-importer-item.show');
        } else if (tables_created_count === 1) {
          return _t('components.background-importer.background-importer-item.show');
        }
      }
    }

    return false;
  },

  updateNotification: function () {
    var data = {
      info: this._getInfo(),
      status: this._getStatus(),
      closable: this._getClosable(),
      button: this._getButton()
    };

    console.log(data.status);

    this._notification.update(data);
  },

  _showImportStats: function () {
    var self = this;
    var modal = this._modals.create(function (modalModel) {
      return new TwitterImportDetailsDialog({
        modalModel: modalModel,
        userModel: self._userModel,
        model: self._importModel
      });
    });
    modal.show();
  },

  _showImportError: function () {
    var self = this;
    var modal = this._modals.create(function (modalModel) {
      return new ErrorDetailsView({
        configModel: self._configModel,
        modalModel: modalModel,
        error: self.model.getError(),
        userModel: self._userModel
      });
    });
    modal.show();
  },

  _showImportWarnings: function () {
    var self = this;
    var modal = this._modals.create(function (modalModel) {
      return new WarningsDetailsView({
        modalModel: modalModel,
        warnings: self.model.getWarnings(),
        userModel: self._userModel
      });
    });
    modal.show();
  }
});
