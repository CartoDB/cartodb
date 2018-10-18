const CoreView = require('backbone/core-view');
const UploadConfig = require('builder/config/upload-config');
const ErrorDetailsView = require('builder/components/background-importer/error-details-view');
const WarningsDetailsView = require('builder/components/background-importer/warnings-details-view');
const TwitterImportDetailsView = require('builder/components/background-importer/twitter-import-details-view');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const template = require('./background-import-item.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'showSuccessDetailsButton'
];

/**
 *  Import item within background importer
 *
 */

module.exports = CoreView.extend({
  className: 'ImportItem',
  tagName: 'li',

  events: {
    'click .js-abort': '_removeItem',
    'click .js-show_error': '_showImportError',
    'click .js-show_warnings': '_showImportWarnings',
    'click .js-show_stats': '_showImportStats',
    'click .js-close': '_removeItem'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._modals = new ModalsServiceModel();
    this._initBinds();
  },

  render: function () {
    const upload = this.model.get('upload');
    const importModel = this.model.get('import');

    let templateData = {
      name: '',
      state: this.model.get('state'),
      progress: '',
      service: '',
      step: this.model.get('step'),
      url: '',
      failed: this.model.hasFailed(),
      completed: this.model.hasCompleted(),
      warnings: this.model.getWarnings(),
      showSuccessDetailsButton: this._showSuccessDetailsButton,
      tables_created_count: importModel.tables_created_count
    };

    // URL
    if (templateData.state === 'complete') {
      const vis = this.model.importedVis();
      if (vis) {
        templateData.url = encodeURI(vis.viewUrl(this._userModel).edit());
      }
    }

    // Name
    if (upload.type) {
      if (upload.type === 'file') {
        if (upload.value.length > 1) {
          templateData.name = upload.value.length + ' files';
        } else {
          templateData.name = upload.value.name;
        }
      }
      if (upload.type === 'url' || upload.type === 'remote') {
        templateData.name = upload.value;
      }
      if (upload.type === 'service') {
        templateData.name = upload.value && upload.value.filename || '';
      }
      if (upload.service_name === 'twitter_search') {
        templateData.name = 'Twitter import';
      }
      if (upload.type === 'sql') {
        templateData.name = 'SQL';
      }
      if (upload.type === 'duplication') {
        templateData.name = upload.table_name || upload.value;
      }
    } else {
      templateData.name = importModel.display_name || importModel.item_queue_id || 'import';
    }

    // Service
    templateData.service = upload.service_name;

    // Progress
    if (this.model.get('step') === 'upload') {
      templateData.progress = this.model.get('upload').progress;
    } else {
      templateData.progress = (UploadConfig.uploadStates.indexOf(templateData.state) / UploadConfig.uploadStates.length) * 100;
    }

    this.$el.html(template(templateData));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'remove', this.clean);
  },

  _removeItem: function () {
    this.trigger('remove', this.model, this);
    this.model.pause();
    this.clean();
  },

  _showImportStats: function () {
    this._modals.create(modalModel => {
      return new TwitterImportDetailsView({
        userModel: this._userModel,
        model: this.model,
        modalModel: this._modalModel
      });
    });
  },

  _showImportError: function () {
    this._modals.create(() => {
      return new ErrorDetailsView({
        error: this.model.getError(),
        userModel: this._userModel,
        configModel: this._configModel
      });
    });
  },

  _showImportWarnings: function () {
    this._modals.create(modalModel => {
      return new WarningsDetailsView({
        warnings: this.model.getWarnings(),
        userModel: this._userModel
      });
    });
  }
});
