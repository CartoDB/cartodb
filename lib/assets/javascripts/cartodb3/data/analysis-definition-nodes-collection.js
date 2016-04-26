var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('./analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var AnalysisTableModel = require('./analysis-table-model');

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.sqlAPI) throw new Error('sqlAPI is required');
    if (!opts.vis) throw new Error('vis is required');

    this._configModel = opts.configModel;
    this._sqlAPI = opts.sqlAPI;
    this._vis = opts.vis;
  },

  model: function (r, opts) {
    var self = opts.collection;

    opts = _.extend(
      {
        sqlAPI: self._sqlAPI,
        parse: true,
        configModel: self._configModel,
        analysisNode: self._vis.analysis && self._vis.analysis.findNodeById(r.id)
      },
      opts
    );

    return r.type === 'source'
      ? new AnalysisDefinitionNodeSourceModel(r, opts)
      : new AnalysisDefinitionNodeModel(r, opts);
  },

  /**
   * Attachs an analysis node and a table model to execute queries
   * @param {String, Object} m: analysisDefinitionNodeModel
   */
  prepareNode: function (m) {
    if (!m.analysisNode) {
      m.analysisNode = this._vis.analysis && this._vis.analysis.findNodeById(m.get('id'));
    }

    if (!m.analysisTableModel) {
      m.analysisTableModel = new AnalysisTableModel({
        query: m.analysisNode.get('query'),
        status: m.analysisNode.get('status')
      }, {
        configModel: this._configModel
      });
    }
  }
});
