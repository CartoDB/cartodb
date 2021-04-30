var Backbone = require('backbone');
var nodeIds = require('builder/value-objects/analysis-node-ids');
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

  findAnalysisThatContainsNode: function (nodeDefModel) {
    return this.findWhere({node_id: nodeDefModel.id}) ||
      this.find(function (m) {
        return m.containsNode(nodeDefModel);
      });
  },

  findAnalysisForLayer: function (layerDefModel) {
    var layerLetter = layerDefModel.get('letter');

    return this.find(function (m) {
      var letter = nodeIds.letter(m.get('node_id'));
      return letter === layerLetter;
    });
  },

  newAnalysisForNode: function (nodeDefModel) {
    return this.add({analysis_definition: nodeDefModel.toJSON()});
  },

  /**
   * @param {object} layerDefModel - instance of an analysis-definition-node-model
   * @return {jqXHR, undefined} A promise if created a new analysis
   */
  saveAnalysisForLayer: function (layerDefModel, containingAnalysisNode = true) {
    if (!layerDefModel) throw new Error('layerDefModel is required');

    var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
    var analysisDefModel = this.findAnalysisForLayer(layerDefModel);

    if (layerDefModel.isOwnerOfAnalysisNode(nodeDefModel)) {
      if (analysisDefModel) {
        analysisDefModel.set('node_id', nodeDefModel.id);
      } else {
        analysisDefModel = this.add({analysis_definition: nodeDefModel.toJSON()});
      }
    } else {
      if (analysisDefModel) {
        analysisDefModel.destroy(); // layer's node is owned by another layer, so the existing analysis should be deleted
      }
    }

    this.each(function (analysisDefModel) {
      if (containingAnalysisNode) {
        if (!analysisDefModel.containsNode(nodeDefModel)) {
          return;
        }
      } else {
        if (!analysisDefModel.ownsNode(nodeDefModel)) {
          return;
        }
      }

      analysisDefModel.save();
    });

    return analysisDefModel;
  }

});
