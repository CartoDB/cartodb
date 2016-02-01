var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var ImportItemView = require('./views/imports/background_import_item_view');
var AnalysisItemView = require('./views/analysis/background_analysis_item_view');
var GeocodingItemView = require('./views/geocodings/background_geocoding_item_view');
var ImportLimitItemView = require('./views/imports/background_import_limit_view');
var ImportsModel = require('./models/imports_model');
var GeocodingModel = require('./models/geocoding_model');
var BackgroundPollingModel = require('./background_polling_model');
var BackgroundPollingHeaderView = require('./views/background_polling_header_view');

/**
 *  Background polling view
 *
 *  It will pool all polling operations that happens
 *  in Cartodb, as in imports and geocodings
 *
 */

module.exports = cdb.core.View.extend({

  className: 'BackgroundPolling',

  initialize: function() {
    this.user = this.options.user;
    this.createVis = this.options.createVis;
    this.vis = this.options.vis;
    if (!this.model) {
      this.model = new BackgroundPollingModel({}, {
        user: this.user
      });
    }
    this.template = cdb.templates.getTemplate('common/background_polling/background_polling');
    this._initBinds();
  },

  render: function() {
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('importAdded', this._addImport, this);
    this.model.bind('geocodingAdded', this._addGeocoding, this);
    this.model.bind('analysisAdded', this._addAnalysis, this);
    this.model.bind('analysisAdded analysisRemoved importAdded importRemoved geocodingAdded geocodingRemoved', this._checkPollingsSize, this);
    cdb.god.bind('importByUploadData', this._addDataset, this);
    cdb.god.bind('fileDropped', this._onDroppedFile, this);
    this.add_related_model(cdb.god);
  },

  _initViews: function() {
    var backgroundPollingHeaderView = new BackgroundPollingHeaderView({
      model: this.model
    });

    this.$el.prepend(backgroundPollingHeaderView.render().el);
    this.addView(backgroundPollingHeaderView);
  },

  _checkPollingsSize: function() {
    if (this.model.getTotalPollings() > 0) {
      this.show();
    } else {
      this.hide();
    }
  },

  _addAnalysis: function(collection) {

    if (this._analysisItem) {
      this._analysisItem.clean();
    }

    this._analysisItem = new AnalysisItemView({
      collection: collection,
      vis: this.vis,
      user: this.user
    });

    this._analysisItem.bind('remove', function(mdl) {
      this.model.removeAnalysis();
    }, this);

    this.$('.js-list').prepend(this._analysisItem.render().el);
    this.addView(this._analysisItem);
  },

  _addGeocoding: function(mdl) {
    var geocodingItem = new GeocodingItemView({
      showGeocodingDatasetURLButton: this.model.get('showGeocodingDatasetURLButton'),
      model: mdl,
      user: this.user
    });

    geocodingItem.bind('remove', function(mdl) {
      this.model.removeGeocodingItem(mdl);
    }, this);

    this.$('.js-list').prepend(geocodingItem.render().el);
    this.addView(geocodingItem);

    // Enable pollings again
    this.enable();
  },

  _addImport: function(m) {
    var importItem = new ImportItemView({
      showSuccessDetailsButton: this.model.get('showSuccessDetailsButton'),
      model: m,
      user: this.user
    });

    importItem.bind('remove', function(mdl) {
      this.model.removeImportItem(mdl);
    }, this);

    this.$('.js-list').prepend(importItem.render().el);
    this.addView(importItem);

    this.enable();
  },

  _addDataset: function(d) {
    if (d) {
      this._addImportsItem(d);
    }
  },

  _onDroppedFile: function(files) {
    if (files) {
      this._addImportsItem({
        type: 'file',
        value: files,
        create_vis: this.createVis
      });
    }
  },

  _addImportsItem: function(uploadData) {
    if (this.model.canAddImport()) {
      this._removeLimitItem();
    } else {
      this._addLimitItem();
      return false;
    }

    var imp = new ImportsModel({}, {
      upload: uploadData,
      user: this.user
    });
    this.model.addImportItem(imp);
  },

  // Limits view

  _addLimitItem: function() {
    if (!this._importLimit) {
      var v = new ImportLimitItemView({
        user: this.user
      });
      this.$('.js-list').prepend(v.render().el);
      this.addView(v);
      this._importLimit = v;
    }
  },

  _removeLimitItem: function() {
    var v = this._importLimit;
    if (v) {
      v.clean();
      this.removeView(v);
      delete this._importLimit;
    }
  },

  // Enable background polling checking
  // ongoing imports
  enable: function() {
    this.model.startPollings();
  },

  // Disable/stop background pollings
  disable: function() {
    this.model.stopPollings();
  },

  show: function() {
    this.$el.addClass('is-visible');
  },

  hide: function() {
    this.$el.removeClass('is-visible');
  },

  clean: function() {
    this.disable();
    this.elder('clean');
  }

});
