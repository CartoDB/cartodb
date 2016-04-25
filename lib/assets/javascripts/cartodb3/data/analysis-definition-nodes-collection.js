var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('./analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var AnalysisTableModel = require('./analysis-table-model');

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  model: function (r, opts) {
    var self = opts.collection;

    opts = _.extend(
      {
        sqlAPI: self._sqlAPI,
        parse: true,
        configModel: self._configModel
      },
      opts
    );

    return r.type === 'source'
      ? new AnalysisDefinitionNodeSourceModel(r, opts)
      : new AnalysisDefinitionNodeModel(r, opts);
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.sqlAPI) throw new Error('sqlAPI is required');
    if (!opts.analysisCollection) throw new Error('analysisCollection is required');

    this._sqlAPI = opts.sqlAPI;
    this._analysisCollection = opts.analysisCollection;
    this._configModel = opts.configModel;

    this.listenTo(this._analysisCollection, 'change add reset sync', this._onAnalysisModelChange); // TODO: we shouldn't access private objs
  },

  _onAnalysisModelChange: function (m) {
    var analysisDefinitionNodeModel = this.models.find(function (model) {
      return model.get('id') === m.get('id');
    });

    var self = this;

    if (analysisDefinitionNodeModel && !analysisDefinitionNodeModel.analysisTableModel) {
      analysisDefinitionNodeModel.analysisTableModel = new AnalysisTableModel({}, {
        configModel: self._configModel
      });
    }

    if (analysisDefinitionNodeModel && m.get('query')) {
      analysisDefinitionNodeModel.analysisTableModel.set('query', m.get('query'));
      analysisDefinitionNodeModel.analysisMetadata = m;
    }
  }

});
