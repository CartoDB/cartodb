var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Node for a trade area
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  defaults: {
    type: 'trade-area'
  },

  parse: function (r) {
    var p = r.params;

    // Recover source analysis model
    this.collection.add(p.source);

    return {
      id: r.id,
      kind: p.kind,
      source_id: p.source.id,
      time: p.time
    };
  },

  toJSON: function () {
    return {
      id: this.id,
      type: this.get('type'),
      params: {
        kind: this.get('kind'),
        time: this.get('time'),
        source: this.collection.get(this.sourceIds()[0]).toJSON()
      }
    };
  }

});
