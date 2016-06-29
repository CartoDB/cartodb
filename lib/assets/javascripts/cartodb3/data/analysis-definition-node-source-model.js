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
  },

  saveQuery: function (d) {
    if (!d.query) throw new Error('query is required');
    if (!d.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!d.layerDefModel) throw new Error('layerDefModel is required');

    this.set('query', d.query || '');

    var analysisDefinitionModel = d.analysisDefinitionsCollection.findAnalysisThatContainsNode(this);
    if (analysisDefinitionModel) {
      analysisDefinitionModel.save();
    } else {
      d.analysisDefinitionsCollection.create({analysis_definition: this.toJSON()});
      d.layerDefModel.save();
    }
  }

});
