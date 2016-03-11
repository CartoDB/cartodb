var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Analysis definition model.
 * Points to a node that is the head of the particular analyzes.
 */
module.exports = cdb.core.Model.extend({

  parse: function (r, opts) {
    opts.analysisDefinitionNodesCollection.add(r.analysis_definition);

    var attrs = _.omit(r, 'analysis_definition');
    attrs.node_id = r.analysis_definition.id;

    return attrs;
  },

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
  },

  toJSON: function () {
    return {
      id: this.id,
      analysis_definition: this._analysisDefinitionNodesCollection.get(this.get('node_id')).toJSON()
    };
  }

});
