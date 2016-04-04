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
      analysisDefinitionNodesCollection: self.analysisDefinitionNodesCollection
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.analysis) throw new Error('analysis is required');
    if (!options.vizId) throw new Error('vizId is required');
    if (!options.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this._configModel = options.configModel;
    this._analysis = options.analysis;
    this._vizId = options.vizId;
    this.analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;

    this.on('reset', this._onReset, this);
    this.on('add change:node_id', this._analyseDefinition, this);
    this.on('remove', this._onRemove, this);

    this.listenTo(this.analysisDefinitionNodesCollection, 'add', this._onAnalysisDefinitionNodeAdd);
    this.listenTo(this.analysisDefinitionNodesCollection, 'change', this._onAnalysisDefinitionNodeChange);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this._vizId + '/analyses';
  },

  _onReset: function () {
    this.each(this._analyseDefinition, this);
  },

  _analyseDefinition: function (m) {
    var id = m.get('node_id');
    var nodeDefModel = this.analysisDefinitionNodesCollection.get(id);
    this._analysis.analyse(nodeDefModel.toJSON());
  },

  _onRemove: function (m) {
    var id = m.get('node_id');
    var node = this._analysis.findNodeById(id);
    if (node) {
      node.remove();
    }
  },

  _onAnalysisDefinitionNodeAdd: function (nodeModel) {
    var sourceNodeId = nodeModel.getPrimarySourceId();
    if (!sourceNodeId) return; // if there is no primary source it's a root (source) node, does not have any analysis

    var opts = {
      error: function () {
        nodeModel.destroy();
      }
    };

    var analysisDefinitionModel = this.find(function (m) {
      return m.get('node_id') === sourceNodeId;
    });

    if (analysisDefinitionModel) {
      analysisDefinitionModel.save({node_id: nodeModel.id}, opts);
    } else {
      this.create({analysis_definition: nodeModel.toJSON()}, opts);
    }
  },

  _onAnalysisDefinitionNodeChange: function (nodeModel) {
    this._analysis.analyse(nodeModel.toJSON());
  }

});
