const $ = require('jquery');
const CoreView = require('backbone/core-view');
const ImportItemView = require('dashboard/views/dashboard/imports/background-import-item');
// const AnalysisItemView = require('./views/analysis/background_analysis_item_view');
const GeocodingItemView = require('dashboard/views/dashboard/geocodings/background-geocoding-item-view');
// const ImportLimitItemView = require('./views/imports/background_import_limit_view');
const ImportsModel = require('dashboard/data/import-model');
const BackgroundPollingModel = require('dashboard/data/background-polling-model');
const BackgroundPollingHeaderView = require('./views/background_polling_header_view');
const template = require('./background-polling.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel',
  'visModel',
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
    this.listenTo(this.model, 'geocodingAdded', this._addGeocoding);
    this.listenTo(this.model, 'analysisAdded', this._addAnalysis);
    this.listenTo(this.model, 'analysisAdded analysisRemoved importAdded importRemoved geocodingAdded geocodingRemoved', this._checkPollingsSize);

    // TODO: Still needed
    // cdb.god.bind('importByUploadData', this._addDataset, this);
    // cdb.god.bind('fileDropped', this._onDroppedFile, this);
    // this.add_related_model(cdb.god);
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

  _addAnalysis: function (collection) {
    if (this._analysisItem) {
      this._analysisItem.clean();
    }

    this._analysisItem = new AnalysisItemView({
      collection: collection,
      vis: this.vis,
      user: this.user
    });

    this._analysisItem.bind('remove', function (mdl) {
      this.model.removeAnalysis();
    }, this);

    this.$('.js-list').prepend(this._analysisItem.render().el);
    this.addView(this._analysisItem);
  },

  _addGeocoding: function (mdl) {
    const geocodingItem = new GeocodingItemView({
      showGeocodingDatasetURLButton: this.model.get('showGeocodingDatasetURLButton'),
      model: mdl,
      user: this.user
    });

    geocodingItem.bind('remove', function (mdl) {
      this.model.removeGeocodingItem(mdl);
    }, this);

    this.$('.js-list').prepend(geocodingItem.render().el);
    this.addView(geocodingItem);

    // Enable pollings again
    this.enable();
  },

  _addImport: function (m) {
    const importItem = new ImportItemView({
      showSuccessDetailsButton: this.model.get('showSuccessDetailsButton'),
      model: m,
      user: this.user
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
        create_vis: this.createVis
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
      user: this.user
    });
    this.model.addImportItem(imp);
  },

  // Limits view

  _addLimitItem: function () {
    if (!this._importLimit) {
      const view = new ImportLimitItemView({
        user: this.user
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
