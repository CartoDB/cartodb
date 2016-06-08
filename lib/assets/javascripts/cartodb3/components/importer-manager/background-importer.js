var Backbone = require('backbone');
var BackgroundItemModel = require('./background-import-item-model');
var ImportItem = require('./background-import-item');

/**
 *  Background polling manager
 *
 *  It will pool all polling operations that happens
 *  in Cartodb, as in imports and geocodings
 *
 */

var BackgroundImporterCollection = Backbone.Collection.extend({

  model: BackgroundItemModel,

  initialize: function (models, opts) {
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

  enable: function () {
    this._model.startPollings();
  },

  disable: function () {
    this._model.stopPollings();
  },

  destroy: function () {
    this.disable();
    this.stopListening();
  },

  removeImport: function (model) {
    this._model.removeImportItem(model);
  },

  _initBinds: function () {
    this._model.on('importAdded', this._addImport, this);
    // this._model.on('geocodingAdded', this._addGeocoding, this);
    // this._model.on('importAdded importRemoved geocodingAdded geocodingRemoved', this._checkPollingsSize, this);

    // TODO: replace god
    // cdb.god.on('importByUploadData', this._addDataset, this);
    // cdb.god.on('fileDropped', this._onDroppedFile, this);
    // this.add_related_model(cdb.god);
  },

  _addImport: function (m) {
    var importItem = new ImportItem({
      configModel: this._configModel,
      showSuccessDetailsButton: this._model.get('showSuccessDetailsButton'),
      modals: this._modals,
      importModel: m,
      collection: this,
      userModel: this._userModel
    });

    this.add(importItem);
    this.enable();
  }
});

var manager = (function () {
  var initialized = false;
  var collection;

  return {
    init: function (opts) {
      if (!initialized) {
        collection = new BackgroundImporterCollection(null, opts);
      }
      return collection;
    }
  };
})();

module.exports = manager;
