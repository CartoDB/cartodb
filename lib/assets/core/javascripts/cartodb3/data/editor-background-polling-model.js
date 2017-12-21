var BackgroundPollingModel = require('./background-importer/background-polling-model');
var TableModel = require('./table-model');

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
      var tableModel = new TableModel({
        name: tableName
      }, {
        configModel: this._configModel
      });

      // Provide table geometry in order to set properly styles when
      // layer is added to the current map
      var onTableFetched = function () {
        this._userActions.createLayerFromTable(tableModel);
        this.trigger('importCompleted', importsModel, this);
      }.bind(this);

      tableModel.fetch().always(onTableFetched);
    }
  }
});
