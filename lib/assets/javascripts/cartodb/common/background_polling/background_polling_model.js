var cdb = require('cartodb.js');
var ImportsCollection = require('./models/imports_collection');
var GeocodingsCollection = require('./models/geocodings_collection');

/**
 *  Background polling default model
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    showSuccessDetailsButton: false,
    geocodingsPolling: false, // enable geocodings polling
    importsPolling: false // enable imports polling
  },

  initialize: function(attrs, opts) {
    this.user = opts.user;
    this.importsCollection = opts.importsCollection || new ImportsCollection(null, { user: this.user });
    this.geocodingsCollection = opts.geocodingsCollection || new GeocodingsCollection(null, { user: this.user });
    this._initBinds();
    this.startPollings();
  },

  _initBinds: function() {
    this.importsCollection.bind('change:state', function(mdl) {
      this.trigger('change', mdl, this);
      this._onImportsStateChange(mdl)
    }, this);
    this.importsCollection.bind('remove', function(mdl) {
      this.trigger('importRemoved', mdl, this);
    }, this);
    this.importsCollection.bind('add', function(mdl) {
      this.trigger('importAdded', mdl, this);
    }, this);

    this.geocodingsCollection.bind('change:state', function(mdl) {
      this.trigger('change', mdl, this);
      this._onGeocodingsStateChange(mdl);
    }, this);
    this.geocodingsCollection.bind('remove', function(mdl) {
      this.trigger('geocodingRemoved', mdl, this);
    }, this);
    this.geocodingsCollection.bind('add', function(mdl) {
      this.trigger('geocodingAdded', mdl, this);
    }, this);
  },

  // Helper functions

  getTotalFailedItems: function() {
    return this.importsCollection.failedItems().length + this.geocodingsCollection.failedItems().length;
  },

  removeImportItem: function(mdl) {
    if (!mdl) {
      return false;
    }
    this.importsCollection.remove(mdl);
  },

  addImportItem: function(mdl) {
    if (!mdl) {
      return false;
    }
    this.importsCollection.add(mdl);
  },

  removeGeocodingItem: function(mdl) {
    if (!mdl) {
      return false;
    }
    this.geocodingsCollection.remove(mdl);
  },

  addGeocodingItem: function(mdl) {
    if (!mdl) {
      return false;
    }
    this.geocodingsCollection.add(mdl);
  },

  canAddImport: function() {
    return this.importsCollection.canImport();
  },

  canAddGeocoding: function() {
    return this.geocodingsCollection.canGeocode();
  },

  getTotalPollings: function() {
    return this.importsCollection.size() + this.geocodingsCollection.size();
  },

  stopPollings: function() {
    if (this.get('geocodingsPolling')) {
      this.geocodingsCollection.destroyCheck();
    }
    if (this.get('importsPolling')) {
      this.importsCollection.destroyCheck();
    }
  },

  startPollings: function() {
    if (this.get('geocodingsPolling')) {
      this.geocodingsCollection.pollCheck();
    }
    if (this.get('importsPolling')) {
      this.importsCollection.pollCheck();
    }
  },

  // onChange functions
  _onImportsStateChange: function() {},

  _onGeocodingsStateChange: function() {},

  clean: function() {
    this.importsCollection.unbind(null, null, this);
    this.geocodingsCollection.unbind(null, null, this);
    this.elder('clean');
  }

});
