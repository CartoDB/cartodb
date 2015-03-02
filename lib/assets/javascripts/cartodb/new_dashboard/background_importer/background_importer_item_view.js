var cdb = require('cartodb.js');
var UploadConfig = require('../../new_common/upload_config');
var ErrorDetailsDialog = require('../../new_dashboard/dialogs/error_details_view');
var SuccessDetailsDialog = require('../../new_dashboard/dialogs/success_details_view');

/**
 *  Import item within background importer
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportItem',
  tagName: 'li',

  events: {
    'click .js-abort':      '_abortUpload',
    'click .js-show_error': '_showImportError',
    'click .js-show_stats': '_showImportStats',
    'click .js-close':      '_removeItem'
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_dashboard/views/background_importer/background_importer_item_view');
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
      tables_created_count: imp.tables_created_count
    };

    // URL
    if (imp.table_name) {
      if (imp.derived_visualization_id) {
        var vis = new cdb.admin.Visualization({ id: imp.derived_visualization_id });
        vis.permission.owner = this.user;
        d.url = encodeURI(this.router.currentUserUrl.mapUrl(vis).toEdit());
      } else {
        var table = new cdb.admin.CartoDBTableMetadata({ name: imp.table_name });
        d.url = encodeURI(this.router.currentUserUrl.datasetsUrl().toDataset(table));
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
    } else {
      d.name = imp.item_queue_id || 'import';
    }

    // Service
    var serviceName = this.model.get('upload').service_name;
    if (serviceName && serviceName !== 'twitter_search') {
      d.service = serviceName;
    }

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
    this.model.bind('change:state', this._onStateChange, this);
    this.model.bind('change', this.render, this);
    this.model.bind('remove', this.clean, this);
  },

  _onStateChange: function() {
    if (this.model.get('state') === "complete") {
      this.trigger('completed', this);
    }
  },

  _removeItem: function() {
    this.trigger('remove', this.model, this);
    this.model.pause();
    this.clean();
  },

  _showImportStats: function() {
    (new SuccessDetailsDialog({
      clean_on_hide: true,
      model: this.model
    })).appendToBody();
  },

  _abortUpload: function() {
    this.model.stopUpload();
  },

  _showImportError: function() {
    (new ErrorDetailsDialog({
      clean_on_hide: true,
      model: this.model
    })).appendToBody();
  }

});
