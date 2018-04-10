const Backbone = require('backbone');
const ImportsCollection = require('dashboard/data/imports-collection');
const GeocodingsCollection = require('dashboard/data/background-polling/geocodings-collection');
const AnalysisCollection = require('dashboard/data/background-polling/analysis-collection');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const pollingsTimer = 3000;

const REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

/**
 *  Background polling default model
 *
 */

module.exports = Backbone.Model.extend({
  defaults: {
    showGeocodingDatasetURLButton: false,
    showSuccessDetailsButton: true,
    geocodingsPolling: false, // enable geocodings polling
    importsPolling: false // enable imports polling
  },

  initialize: function (attributes, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.importsCollection = options.importsCollection || new ImportsCollection(null, {
      userModel: this._userModel,
      configModel: this._configModel
    });
    this.geocodingsCollection = options.geocodingsCollection || new GeocodingsCollection(null, {
      userModel: this._userModel,
      visModel: this._visModel,
      configModel: this._configModel
    });
    this.analysisCollection = options.anaylysisCollection || new AnalysisCollection(null, { userModel: this._userModel });
    this._initBinds();
    this.startPollings();
  },

  _initBinds: function () {
    this.importsCollection.bind('change:state', function (mdl) {
      this.trigger('change', mdl, this);
      this._onImportsStateChange(mdl);
    }, this);
    this.importsCollection.bind('remove', function (mdl) {
      this.trigger('importRemoved', mdl, this);
    }, this);
    this.importsCollection.bind('add', function (mdl) {
      this.trigger('importAdded', mdl, this);
    }, this);

    this.geocodingsCollection.bind('change:state', function (mdl) {
      this.trigger('change', mdl, this);
      this._onGeocodingsStateChange(mdl);
    }, this);
    this.geocodingsCollection.bind('remove', function (mdl) {
      this.trigger('geocodingRemoved', mdl, this);
    }, this);
    this.geocodingsCollection.bind('add', function (mdl) {
      this.trigger('geocodingAdded', mdl, this);
    }, this);

    this.analysisCollection.bind('reset', function () {
      if (this.analysisCollection.size() > 0) {
        this.trigger('analysisAdded', this.analysisCollection, this);
      } else {
        this.trigger('analysisRemoved', this.analysisCollection, this);
      }
    }, this);

    this.analysisCollection.bind('change:state', function (mdl) {
      this._onAnalysisStateChange(mdl, this.analysisCollection);
    }, this);
  },

  // Helper functions

  getTotalFailedItems: function () {
    return this.importsCollection.failedItems().length + this.geocodingsCollection.failedItems().length;
  },

  removeImportItem: function (mdl) {
    if (!mdl) {
      return false;
    }
    this.importsCollection.remove(mdl);
  },

  addImportItem: function (mdl) {
    if (!mdl) {
      return false;
    }
    this.importsCollection.add(mdl);
  },

  removeGeocodingItem: function (mdl) {
    if (!mdl || !this.canAddImport()) {
      return false;
    }
    this.geocodingsCollection.remove(mdl);
  },

  addGeocodingItem: function (mdl) {
    if (!mdl || !this.canAddGeocoding()) {
      return false;
    }
    this.geocodingsCollection.add(mdl);
  },

  removeAnalysis: function () {
    this.analysisCollection.destroyCheck();
    this.analysisCollection.reset();
  },

  addAnalysis: function (array) {
    if (!array || !this.canAddAnalysis()) {
      return false;
    }
    this.analysisCollection.reset(array);
  },

  canAddImport: function () {
    return this.importsCollection.canImport();
  },

  canAddGeocoding: function () {
    return this.geocodingsCollection.canGeocode();
  },

  canAddAnalysis: function () {
    return this.analysisCollection.canStartPecan();
  },

  getTotalImports: function () {
    return this.importsCollection.size();
  },

  getTotalGeocodings: function () {
    return this.geocodingsCollection.size();
  },

  getTotalAnalysis: function () {
    return this.analysisCollection.size() > 0 ? 1 : 0;
  },

  getTotalPollings: function () {
    return this.importsCollection.size() + this.geocodingsCollection.size() + (this.analysisCollection.isAnalyzing() ? 1 : 0);
  },

  stopPollings: function () {
    if (this.get('geocodingsPolling')) {
      this.geocodingsCollection.destroyCheck();
    }
    if (this.get('importsPolling')) {
      this.importsCollection.destroyCheck();
    }
  },

  startPollings: function () {
    // Don't start pollings inmediately,
    // wait some seconds
    setTimeout(() => {
      if (this.get('geocodingsPolling')) {
        this.geocodingsCollection.pollCheck();
      }
      if (this.get('importsPolling')) {
        this.importsCollection.pollCheck();
      }
    }, pollingsTimer);
  },

  // onChange functions
  _onImportsStateChange: function () {},

  _onGeocodingsStateChange: function () {},

  _onAnalysisStateChange: function () {},

  clean: function () {
    this.importsCollection.unbind(null, null, this);
    this.geocodingsCollection.unbind(null, null, this);
    this.analysisCollection.unbind(null, null, this);
    Backbone.Model.prototype.clean.apply(this);
  }

});
