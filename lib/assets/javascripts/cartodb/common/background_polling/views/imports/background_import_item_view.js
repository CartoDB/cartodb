var cdb = require('cartodb.js');
var UploadConfig = require('../../models/upload_config');
var ErrorDetailsView = require('../../../views/error_details_view');
var WarningsDetailsView = require('../../../views/warnings_details_view');
var ViewFactory = require('../../../view_factory');
var TwitterImportDetailsDialog = require('./twitter_import_details_view');

/**
 *  Import item within background importer
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportItem',
  tagName: 'li',

  events: {
    'click .js-abort':      '_removeItem',
    'click .js-show_error': '_showImportError',
    'click .js-show_warnings': '_showImportWarnings',
    'click .js-show_stats': '_showImportStats',
    'click .js-close':      '_removeItem'
  },

  initialize: function() {
    this.user = this.options.user;
    this._showSuccessDetailsButton = this.options.showSuccessDetailsButton;
    this.template = cdb.templates.getTemplate('common/background_polling/views/imports/background_import_item');
    this._initBinds();
  },

  render: function() {
    var upload = this.model.get('upload');
    var imp = this.model.get('import');

    var d = {
      name: '',
      state: this.model.get('state'),
      progress: '',
      service: '',
      step: this.model.get('step'),
      url: '',
      failed: this.model.hasFailed(),
      completed: this.model.hasCompleted(),
      cancelled: this.model.cancelled(),
      warnings: this.model.getWarnings(),
      showSuccessDetailsButton: this._showSuccessDetailsButton,
      tables_created_count: imp.tables_created_count
    };

    // URL
    if (d.state === "complete") {
      var vis = this.model.importedVis();
      if (vis) {
        d.url = encodeURI(vis.viewUrl(this.user).edit());
      }
    }

    // Name
    if (upload.type) {
      if (upload.type === "file") {
        if (upload.value.length > 1) {
          d.name = upload.value.length + ' files';
        } else {
          d.name = upload.value.name;
        }
      }
      if (upload.type === "url" || upload.type === "remote") {
        d.name = upload.value;
      }
      if (upload.type === "service") {
        d.name = upload.value && upload.value.filename || '';
      }
      if (upload.service_name === "twitter_search") {
        d.name = 'Twitter import';
      }
      if (upload.type === "sql") {
        d.name = 'SQL';
      }
      if (upload.type === "duplication") {
        d.name = upload.table_name || upload.value;
      }
    } else {
      d.name = imp.display_name || imp.item_queue_id || 'import';
    }

    // Service
    d.service = upload.service_name;

    // Progress
    if (this.model.get('step') === 'upload') {
      d.progress = this.model.get('upload').progress;
    } else {
      d.progress = (UploadConfig.uploadStates.indexOf(d.state)/UploadConfig.uploadStates.length) * 100;
    }

    this.$el.html(this.template(d));

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('remove', this.clean, this);
  },

  _removeItem: function() {
    this.trigger('remove', this.model, this);
    this.model.cancel();
    this.clean();
  },

  _showImportStats: function() {
    (new TwitterImportDetailsDialog({
      clean_on_hide: true,
      user: this.user,
      model: this.model
    })).appendToBody();
  },

  _showImportError: function() {
    var dialog = ViewFactory.createDialogByView(
      new ErrorDetailsView({
        err: this.model.getError(),
        user: this.user
      })
    );
    dialog.appendToBody();
  },

  _showImportWarnings: function() {
    var dialog = ViewFactory.createDialogByView(
      new WarningsDetailsView({
        warnings: this.model.getWarnings(),
        user: this.user
      })
    );
    dialog.appendToBody();
  }
});
