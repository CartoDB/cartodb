var Backbone = require('backbone');
var ImportsCollection = require('./background-importer-imports-collection');

var POLLINGS_TIMER = 3000;

/**
 *  Background polling default model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    showSuccessDetailsButton: true,
    importsPolling: false // enable imports polling
  },

  initialize: function (attrs, opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;

    this.importsCollection = opts.importsCollection || new ImportsCollection(null, {
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
    var self = this;
    // Don't start pollings inmediately
    setTimeout(function () {
      if (self.get('importsPolling')) {
        self.importsCollection.pollCheck();
      }
    }, POLLINGS_TIMER);
  },

  _onImportsStateChange: function () {},

  clean: function () {
    this.importsCollection.unbind(null, null, this);
  }
});
