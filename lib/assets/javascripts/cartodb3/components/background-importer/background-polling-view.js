var cdb = require('cartodb-deep-insights.js');
var ImportItemView = require('./background-import-item-view');
var GeocodingItemView = require('./background-geocoding-item-view');
var ImportLimitItemView = require('./background-import-limit-view');
var ImportsModel = require('../../data/background-importer/imports-model');
var BackgroundPollingModel = require('../../data/background-importer/background-polling-model');
var BackgroundPollingHeaderView = require('./background-polling-header-view');
var template = require('./background-polling.tpl');

/**
 *  Background polling view
 *
 *  It will pool all polling operations that happens
 *  in Cartodb, as in imports and geocodings
 *
 */

module.exports = cdb.core.View.extend({

  className: 'BackgroundPolling',

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._createVis = opts.createVis;
    this._modals = opts.modals;

    if (!this.model) {
      this.model = new BackgroundPollingModel({}, {
        vis: {},
        configModel: this._configModel,
        userModel: this._userModel
      });
    }
    this._initBinds();
  },

  render: function () {
    this.$el.html(template);
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.model.bind('importAdded', this._addImport, this);
    this.model.bind('geocodingAdded', this._addGeocoding, this);
    this.model.bind('importAdded importRemoved geocodingAdded geocodingRemoved', this._checkPollingsSize, this);

    // TODO: replace god
    cdb.god.bind('importByUploadData', this._addDataset, this);
    cdb.god.bind('fileDropped', this._onDroppedFile, this);
    this.add_related_model(cdb.god);
  },

  _initViews: function () {
    var backgroundPollingHeaderView = new BackgroundPollingHeaderView({
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

  _addGeocoding: function (mdl) {
    var geocodingItem = new GeocodingItemView({
      showGeocodingDatasetURLButton: this.model.get('showGeocodingDatasetURLButton'),
      model: mdl,
      userModel: this._userModel
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
    var importItem = new ImportItemView({
      configModel: this._configModel,
      showSuccessDetailsButton: this.model.get('showSuccessDetailsButton'),
      modals: this._modals,
      model: m,
      userModel: this._userModel
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
        create_vis: this._createVis
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

    var imp = new ImportsModel({}, {
      upload: uploadData,
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.model.addImportItem(imp);
  },

  // Limits view

  _addLimitItem: function () {
    if (!this._importLimit) {
      var v = new ImportLimitItemView({
        userModel: this._userModel
      });
      this.$('.js-list').prepend(v.render().el);
      this.addView(v);
      this._importLimit = v;
    }
  },

  _removeLimitItem: function () {
    var v = this._importLimit;
    if (v) {
      v.clean();
      this.removeView(v);
      delete this._importLimit;
    }
  },

  enable: function () {
    this.model.startPollings();
  },

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
    cdb.core.View.prototype.clean.call(this);
  }
});
