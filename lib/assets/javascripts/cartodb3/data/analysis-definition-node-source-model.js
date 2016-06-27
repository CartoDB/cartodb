var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Special case of a node model representing a source node.
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  /**
   * @override AnalysisDefinitionNodeModel.prototype.initialize
   */
  initialize: function (attrs, opts) {
    AnalysisDefinitionNodeModel.prototype.initialize.apply(this, arguments);

    this.querySchemaModel.set({
      query: this.get('query'),
      may_have_rows: true
    });
  }

});
