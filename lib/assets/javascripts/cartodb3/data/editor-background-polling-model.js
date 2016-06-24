var BackgroundPollingModel = require('./background-importer/background-polling-model');

/**
 *  Background polling model for the editor context.
 */

module.exports = BackgroundPollingModel.extend({

  initialize: function (attrs, opts) {
    BackgroundPollingModel.prototype.initialize.apply(this, arguments);

    if (!opts.layerDefinitionsCollection) { throw new Error('layerDefinitionsCollection is required'); }

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
  },

  _onImportsStateChange: function (importsModel) {
    if (importsModel.hasCompleted()) {
      var tableName = importsModel.importedVis().get('table').name;
      this._layerDefinitionsCollection.createLayerForTable(tableName);
      this.trigger('importCompleted', importsModel, this);
    }
  }
});
