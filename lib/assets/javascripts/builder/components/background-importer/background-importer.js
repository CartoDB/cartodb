var Backbone = require('backbone');
var _ = require('underscore');
var ImportItemView = require('./background-import-item-view');
var ImportLimitItemView = require('./background-import-limit-view');
var ImportsModel = require('builder/data/background-importer/imports-model');

/**
 *  Background polling manager
 *
 *  It will pool all polling operations (imports) that happens
 *  in the Builder
 *
 */

var BackgroundImporter = function (options) {
  this.options = options || {};
  this._importers = {};
  this.initialize(this.options);
};

BackgroundImporter.prototype = {
  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.pollingModel) throw new Error('pollingModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._createVis = opts.createVis;
    this._modals = opts.modals;
    this._model = opts.pollingModel;

    this._initBinds();
  },

  addView: function (view) {
    this._importers[view.cid] = view;
  },

  removeView: function (view) {
    delete this._importers[view.cid];
  },

  enable: function () {
    this._model.startPollings();
  },

  disable: function () {
    this._model.stopPollings();
  },

  removeImport: function (model) {
    this._model.removeImportItem(model);
  },

  destroy: function () {
    this._model.off(null, null, this);
  },

  _initBinds: function () {
    this._model.on('importAdded', this._addImport, this);
    this._model.on('importByUploadData', this._addDataset, this);
  },

  _addImport: function (m) {
    var importItemView = new ImportItemView({
      configModel: this._configModel,
      showSuccessDetailsButton: this._model.get('showSuccessDetailsButton'),
      modals: this._modals,
      importModel: m,
      userModel: this._userModel
    });

    importItemView.on('remove', this._removeImport, this);
    this.addView(importItemView);
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
    if (this._model.canAddImport()) {
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

    this._model.addImportItem(imp);
  },

  _addLimitItem: function () {
    if (!this._importLimit) {
      var view = new ImportLimitItemView({
        configModel: this._configModel,
        userModel: this._userModel
      });

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

  _removeImport: function (model, view) {
    this._model.removeImportItem(model);
    this.removeView(view);
  }
};

// Supporting default Backbone events like on, off, trigger, listenTo etc
_.extend(BackgroundImporter.prototype, Backbone.Events, {
  remove: function () {
    this.stopListening();
  }
});

var manager = (function () {
  var initialized = false;
  var importer;

  return {
    init: function (opts) {
      if (!initialized) {
        importer = new BackgroundImporter(opts);
      }
      return importer;
    }
  };
})();

module.exports = manager;
