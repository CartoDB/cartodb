var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('./analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.sqlAPI) throw new Error('sqlAPI is required');

    this._configModel = opts.configModel;
    this._sqlAPI = opts.sqlAPI;
  },

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
  }

});
