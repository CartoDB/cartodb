var _ = require('underscore');
var cdb = require('cartodb.js');
var syncAbort = require('./backbone/sync-abort');

/**
 * Analysis definition model.
 * Points to a node that is the head of the particular analysis.
 */
module.exports = cdb.core.Model.extend({

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
  },

  parse: function (r, opts) {
    // If parse is called on a new model it have not yet called initialize and thus don't have the collection
    var nodesCollection = this._analysisDefinitionNodesCollection || opts.analysisDefinitionNodesCollection;
    nodesCollection.add(r.analysis_definition, {silent: true});

    var attrs = _.omit(r, 'analysis_definition');
    attrs.node_id = r.analysis_definition.id;

    return attrs;
  },

  toJSON: function () {
    return {
      id: this.id,
      analysis_definition: this._getNodeDefinitionModel().toJSON()
    };
  },

  containsNode: function (nodeDefModel) {
    return this._getNodeDefinitionModel().containsNode(nodeDefModel);
  },

  _getNodeDefinitionModel: function () {
    return this._analysisDefinitionNodesCollection.get(this.get('node_id'));
  }

});
