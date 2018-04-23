const Backbone = require('backbone');
const ImportsCollection = require('dashboard/data/imports-collection');
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
  },

  // Helper functions

  getTotalFailedItems: function () {
    return this.importsCollection.failedItems().length;
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

  canAddImport: function () {
    return this.importsCollection.canImport();
  },

  getTotalImports: function () {
    return this.importsCollection.size();
  },

  getTotalPollings: function () {
    return this.importsCollection.size();
  },

  stopPollings: function () {
    if (this.get('importsPolling')) {
      this.importsCollection.destroyCheck();
    }
  },

  startPollings: function () {
    // Don't start pollings inmediately,
    // wait some seconds
    setTimeout(() => {
      if (this.get('importsPolling')) {
        this.importsCollection.pollCheck();
      }
    }, pollingsTimer);
  },

  // onChange functions
  _onImportsStateChange: function () {},

  clean: function () {
    this.importsCollection.unbind(null, null, this);
    Backbone.Model.prototype.clean.apply(this);
  }

});
