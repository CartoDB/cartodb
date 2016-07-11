var BackgroundPollingModel = require('./background-importer/background-polling-model');

/**
 *  Background polling model for the editor context.
 */

module.exports = BackgroundPollingModel.extend({

  initialize: function (attrs, opts) {
    BackgroundPollingModel.prototype.initialize.apply(this, arguments);

    if (!opts.userActions) { throw new Error('userActions is required'); }

    this._userActions = opts.userActions;
  },

  _onImportsStateChange: function (importsModel) {
    if (importsModel.hasCompleted()) {
      var tableName = importsModel.importedVis().get('table').name;
      this._userActions.createLayerForTable(tableName);
      this.trigger('importCompleted', importsModel, this);
    }
  }
});
