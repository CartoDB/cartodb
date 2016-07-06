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

  findAnalysisThatContainsNode: function (nodeDefModel) {
    return this.findWhere({node_id: nodeDefModel.id}) ||
      this.find(function (m) {
        return m.containsNode(nodeDefModel);
      });
  },

  isPersisted: function (nodeDefModel) {
    return this.any(function (m) {
      return m.containsNode(nodeDefModel);
    });
  },

  /**
   * @param {object} nodeDefModel - instance of an analysis-definition-node-model
   * @param {object} [opts={}]
   * @param {function} [opts.beforeSave] - If provided will be executed if there exist at least one analysis
   * @param {object} [opts.layerDefinitionModel] - if provided it will be saved if a new analysis is created
   * @return {jqXHR, undefined} A promise if created a new analysis
   */
  saveAnalysis: function (nodeDefModel, opts) {
    if (!nodeDefModel) throw new Error('nodeDefModel is required');
    opts = opts || {};

    if (this.findAnalysisThatContainsNode(nodeDefModel)) {
      if (opts.beforeSave) {
        opts.beforeSave();
      }

      this.each(function (m) {
        if (m.containsNode(nodeDefModel)) {
          m.save();
        }
      });
    } else {
      var aDefmodel = this.createAnalysisForNode(nodeDefModel);

      if (opts.layerDefinitionModel) {
        opts.layerDefinitionModel.save();
      }

      return aDefmodel;
    }
  },

  createAnalysisForNode: function (nodeDefModel) {
    return this.create({analysis_definition: nodeDefModel.toJSON()});
  }

});
