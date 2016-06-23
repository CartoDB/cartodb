var Backbone = require('backbone');
var AnalysisDefinitionModel = require('./analysis-definition-model');

/**
 * Collection of analysis definitions.
 */
module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var self = opts.collection;

    var m = new AnalysisDefinitionModel(d, {
      parse: true,
      collection: self, // used implicitly, for model to use collection.url()
      analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.vizId) throw new Error('vizId is required');
    if (!options.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this._configModel = options.configModel;
    this._vizId = options.vizId;
    this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this._vizId + '/analyses';
  },

  findByNodeId: function (id) {
    return this.find(function (m) {
      return m.get('node_id') === id;
    });
  },

  findAnalysisThatContainsNode: function (nodeDefModel) {
    var analysisDefModel = this.findByNodeId(nodeDefModel.id);
    if (analysisDefModel) return analysisDefModel;
    return this.find(function (m) { return m.containsNode(nodeDefModel); });
  }

});
