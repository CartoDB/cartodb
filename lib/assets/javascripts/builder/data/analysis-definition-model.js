var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');

/**
 * Analysis definition model.
 * Points to a node that is the head of the particular analysis.
 */
module.exports = Backbone.Model.extend({

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  initialize: function (attrs, opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this.USER_SAVED = false; // flag to indicate if the user saved the node and avoid triggering the onboarding model if they didn't

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
  },

  parse: function (r, opts) {
    // If parse is called on a new model it have not yet called initialize and thus don't have the collection
    var nodesCollection = this._analysisDefinitionNodesCollection || opts.analysisDefinitionNodesCollection;

    // Merge and parse are used to sync all nodes in a definition with the backend response
    nodesCollection.add(r.analysis_definition, {silent: true, merge: true, parse: true});

    var attrs = _.omit(r, 'analysis_definition');
    attrs.node_id = r.analysis_definition.id;

    return attrs;
  },

  toJSON: function () {
    return {
      id: this.id,
      analysis_definition: this.getNodeDefinitionModel().toJSON()
    };
  },

  ownsNode: function (other) {
    var nodeDefModel = this.getNodeDefinitionModel();
    return !!(nodeDefModel && nodeDefModel.id === other.id);
  },

  containsNode: function (other) {
    var nodeDefModel = this.getNodeDefinitionModel();
    return !!(nodeDefModel && nodeDefModel.containsNode(other));
  },

  getNodeDefinitionModel: function () {
    return this._analysisDefinitionNodesCollection.get(this.get('node_id'));
  }

});
