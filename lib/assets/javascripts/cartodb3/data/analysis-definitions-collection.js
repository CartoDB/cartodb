var Backbone = require('backbone');
var AnalysisDefinitionModel = require('./analysis-definition-model');
var AnalysisDefinitionNodesCollection = require('./analysis-definition-nodes-collection');

/**
 * Collection of analysis definitions
 */
module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var self = opts.collection;

    var m = new AnalysisDefinitionModel(d, {
      parse: true,
      analysisDefinitionNodesCollection: self.analysisDefinitionNodesCollection
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.vizId) throw new Error('vizId is required');

    this._configModel = options.configModel;
    this._vizId = options.vizId;

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this._vizId + '/analyses';
  }

});
