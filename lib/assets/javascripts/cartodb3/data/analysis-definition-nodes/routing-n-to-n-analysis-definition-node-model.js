var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Node for a routing n-to-n analysis node
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  defaults: {
    type: 'routing-n-to-n'
  },

  /**
   * @override {AnalysisDefinitionNodeModel.prototype._sourceNames}
   */
  _sourceNames: function () {
    return ['origin_source_id', 'destination_source_id'];
  },

  parse: function (r) {
    var p = r.params;

    // Recover the source nodes
    this.collection.add(p.origin_source);
    this.collection.add(p.destination_source);

    return {
      id: r.id,
      origin_source_id: p.origin_source.id,
      destination_source_id: p.destination_source.id
    };
  },

  toJSON: function () {
    var sourceIds = this.sourceIds();
    return {
      id: this.id,
      type: this.get('type'),
      params: {
        origin_source: this.collection.get(sourceIds[0]).toJSON(),
        destination_source: this.collection.get(sourceIds[1]).toJSON()
      }
    };
  }

});
