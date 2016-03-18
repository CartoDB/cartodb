var Backbone = require('backbone');
var AnalysisDefinitionModel = require('./analysis-definition-model');
var AnalysisDefinitionNodesCollection = require('./analysis-definition-nodes-collection');

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

    this._configModel = options.configModel;
    this._analysis = options.analysis;
    this._vizId = options.vizId;

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();

    this.on('add', this._onAdd, this);
    this.on('remove', this._onRemove, this);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this._vizId + '/analyses';
  },

  /**
   * It's assumed that node models can only be added for head nodes (checked when nodes are created,
   * so no need to check for that here again.
   */
  createNode: function (nodeAttrs) {
    this.analysisDefinitionNodesCollection.add(nodeAttrs, {parse: false});
    var m = this.analysisDefinitionNodesCollection.last();

    if (m.get('type') !== 'source') {
      this._updateOrCreateAnalysis(m);
    }

    return m;
  },

  _updateOrCreateAnalysis: function (m) {
    var opts = {
      wait: true,
      error: function () {
        m.destroy();
      }
    };

    var sourceNodeId = m.sourceIds()[0];
    var analysisDefinitionModel = this.find(function (m) {
      return m.get('node_id') === sourceNodeId;
    });

    if (analysisDefinitionModel) {
      analysisDefinitionModel.save({node_id: m.id}, opts);
    } else {
      this.create({analysis_definition: m.toJSON()}, opts);
    }
  },

  _onAdd: function (m) {
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
  }

});
