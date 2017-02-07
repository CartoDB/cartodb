var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var TableModel = require('./table-model');
var SQLUtils = require('../helpers/sql-utils');

/**
 *  Case of a node model representing a source node.
 *  - It should provide new info about if the node is read only or not.
 *
 *  Analysis-definition-node-source-model
 *   ├── Query-Schema-Model
 *   ├── Query-Geometry-Model
 *   └── Table-Model
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  defaults: {
    status: 'ready'
  },

  /**
   * @override AnalysisDefinitionNodeModel.prototype.initialize
   */
  initialize: function (attrs, opts) {
    AnalysisDefinitionNodeModel.prototype.initialize.apply(this, arguments);

    var query = this.get('query');
    this.querySchemaModel.set({
      query: query,
      ready: true
    }, { silent: true });

    this.queryGeometryModel.set({
      query: query,
      ready: true
    }, { silent: true });

    var tableData = opts.tableData || { name: this.get('table_name') };
    this.tableModel = new TableModel(tableData, {
      configModel: opts.configModel,
      parse: true
    });
  },

  getDefaultQuery: function () {
    return SQLUtils.getDefaultSQL(
      this.get('table_name'),
      this._userModel.get('username'),
      this._userModel.isInsideOrg()
    );
  },

  hasCustomQuery: function () {
    return !SQLUtils.isSameQuery(
      this._getQuerySchemaModel().get('query'),
      this._getDefaultQuery()
    );
  },

  isReadOnly: function () {
    var isTableReadOnly = this.tableModel.isReadOnly(this._userModel);
    var hasCustomQuery = this._hasCustomQuery();
    return !isTableReadOnly && !hasCustomQuery;
  },

  getTableModel: function () {
    return this.tableModel;
  },

  fetchTable: function () {
    if (!this.tableModel.get('id')) {
      this.tableModel.fetch();
    }
  }

});
