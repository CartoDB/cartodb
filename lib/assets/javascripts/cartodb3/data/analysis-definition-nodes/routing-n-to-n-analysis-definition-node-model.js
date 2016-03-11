var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Node for a routing n-to-n analysis node
 */
module.exports = AnalysisDefinitionNodeModel.extend({

  defaults: {
    type: 'routing-n-to-n'
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
    return {
      id: this.id,
      type: this.get('type'),
      params: {
        origin_source: this.primarySourceModel().toJSON(),
        destination_source: this._sourceModel('destination_source_id').toJSON()
      }
    };
  },

  /**
   * @override {AnalysisDefinitionNodeModel.prototype.primarySourceModel}
   */
  primarySourceModel: function () {
    return this._sourceModel('origin_source_id');
  }

});
