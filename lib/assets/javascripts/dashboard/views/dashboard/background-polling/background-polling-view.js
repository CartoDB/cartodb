const CoreView = require('backbone/core-view');
const ImportItemView = require('dashboard/views/dashboard/imports/background-import-item/background-import-item-view');
const ImportLimitItemView = require('builder/components/background-importer/background-import-limit-view');
const ImportsModel = require('dashboard/data/imports-model');
const BackgroundPollingModel = require('dashboard/data/background-polling/background-polling-model');
const BackgroundPollingHeaderView = require('dashboard/views/dashboard/background-polling/background-polling-header/background-polling-header-view');
const template = require('./background-polling.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'userModel',
  'createVis'
];

/**
 *  Background polling view
 *
 *  It will pool all polling operations that happens
 *  in Cartodb, as in imports and geocodings
 *
 */

module.exports = CoreView.extend({

  className: 'BackgroundPolling',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._vis = options.vis;

    if (!this.model) {
      this.model = new BackgroundPollingModel({}, {
        userModel: this._userModel
      });
    }

    this._initBinds();
  },

  render: function () {
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'importAdded', this._addImport);
    this.listenTo(this.model, 'importAdded importRemoved', this._checkPollingsSize);
  },

  _initViews: function () {
    const backgroundPollingHeaderView = new BackgroundPollingHeaderView({
      model: this.model
    });

    this.$el.prepend(backgroundPollingHeaderView.render().el);
    this.addView(backgroundPollingHeaderView);
  },

  _checkPollingsSize: function () {
    if (this.model.getTotalPollings() > 0) {
      this.show();
    } else {
      this.hide();
    }
  },

  _addImport: function (model) {
    const importItem = new ImportItemView({
      showSuccessDetailsButton: this.model.get('showSuccessDetailsButton'),
      model,
      userModel: this._userModel,
      configModel: this._configModel
    });

    importItem.bind('remove', function (mdl) {
      this.model.removeImportItem(mdl);
    }, this);

    this.$('.js-list').prepend(importItem.render().el);
    this.addView(importItem);

    this.enable();
  },

  _addDataset: function (d) {
    if (d) {
      this._addImportsItem(d);
    }
  },

  _onDroppedFile: function (files) {
    if (files) {
      this._addImportsItem({
        type: 'file',
        value: files,
        create_vis: files._createVis || this._createVis
      });
    }
  },

  _addImportsItem: function (uploadData) {
    if (this.model.canAddImport()) {
      this._removeLimitItem();
    } else {
      this._addLimitItem();
      return false;
    }

    const imp = new ImportsModel({}, {
      upload: uploadData,
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.model.addImportItem(imp);
  },

  // Limits view

  _addLimitItem: function () {
    if (!this._importLimit) {
      const view = new ImportLimitItemView({
        userModel: this._userModel,
        configModel: this._configModel
      });
      this.$('.js-list').prepend(view.render().el);
      this.addView(view);
      this._importLimit = view;
    }
  },

  _removeLimitItem: function () {
    var view = this._importLimit;
    if (view) {
      view.clean();
      this.removeView(view);
      delete this._importLimit;
    }
  },

  // Enable background polling checking
  // ongoing imports
  enable: function () {
    this.model.startPollings();
  },

  // Disable/stop background pollings
  disable: function () {
    this.model.stopPollings();
  },

  show: function () {
    this.$el.addClass('is-visible');
  },

  hide: function () {
    this.$el.removeClass('is-visible');
  },

  clean: function () {
    this.disable();
    CoreView.prototype.clean.apply(this);
  }
});
