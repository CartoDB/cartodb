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
      collection: self, // used implicitly, for model to use collection.url()
      analysisDefinitionNodesCollection: self.analysisDefinitionNodesCollection
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.vizId) throw new Error('vizId is required');

    this._configModel = options.configModel;
    this._vizId = options.vizId;

    var nodes = this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();
    this.listenTo(nodes, 'add', this._onNodeAdd);
    this.listenTo(nodes, 'remove', this._onNodeRemove);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this._vizId + '/analyses';
  },

  /**
   * It's assumed that node models can only be added for head nodes (checked when nodes are created,
   * so no need to check for that here again.
   */
  _onNodeAdd: function (newNodeModel) {
    if (newNodeModel.get('type') !== 'source') {
      var attrs = {analysis_definition: newNodeModel.toJSON()};

      var sourceId = newNodeModel.primarySourceModel().id;

      var analysisDefinitionModel = this.find(function (m) {
        return m.get('node_id') === sourceId;
      });

      if (analysisDefinitionModel) {
        analysisDefinitionModel.save(attrs, {wait: true});
      } else {
        this.create(attrs);
      }
    }
  }

});
