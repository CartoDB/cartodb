var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var TableModel = require('./table-model');

/**
 * Special case of a node model representing a source node.
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

  fetchTable: function () {
    if (!this.tableModel.get('id')) {
      this.tableModel.fetch();
    }
  }

});
