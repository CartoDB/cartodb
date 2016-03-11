var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Node for a total population
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  defaults: {
    type: 'total-population'
  },

  parse: function (r) {
    var p = r.params;

    // Recover source analysis model
    this.collection.add(p.source);

    return {
      id: r.id,
      column_name: p.column_name,
      source_id: p.source.id
    };
  },

  toJSON: function () {
    return {
      id: this.id,
      type: this.get('type'),
      params: {
        column_name: this.get('column_name'),
        source: this.sourceModel().toJSON()
      }
    };
  }

});
