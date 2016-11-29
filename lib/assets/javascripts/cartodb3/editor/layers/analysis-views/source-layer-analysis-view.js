var CoreView = require('backbone/core-view');
var template = require('./source-layer-analysis-view.tpl');
var SQLUtils = require('../../../helpers/sql-utils');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisNode = opts.analysisNode;

    this._tableNodeModel = this._analysisNode.tableModel;

    this._initBinds();
  },

  options: {
    showId: true
  },

  render: function () {
    var originalQuery = 'SELECT * FROM ' + this._layerDefinitionModel.getQualifiedTableName();
    var query = this.model.get('query');

    var syncModel = this._tableNodeModel && this._tableNodeModel.getSyncModel();
    var isSync = syncModel && syncModel.isSync();

    // As we don't know if the user is in an org or not, we check both versions of the query
    var isCustomQueryApplied = !SQLUtils.isSameQuery(originalQuery, query);
    this.$el.html(template({
      id: this.options.showId
        ? this.model.id
        : '',
      tableName: this.model.get('table_name'),
      customQueryApplied: isCustomQueryApplied,
      isSync: isSync,
      syncState: isSync && syncModel.get('state')
    }));

    return this;
  },

  _initBinds: function () {
    this._tableNodeModel.on('change:synchronization', function () {
      this.render();
    }, this);
  }

});
