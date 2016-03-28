var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('./analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  model: function (r, opts) {
    var self = opts.collection;

    opts = {
      parse: _.isBoolean(opts.parse) ? opts.parse : true,
      sqlAPI: self._sqlAPI,
      collection: self
    };

    return r.type === 'source'
      ? new AnalysisDefinitionNodeSourceModel(r, opts)
      : new AnalysisDefinitionNodeModel(r, opts);
  },

  initialize: function (models, opts) {
    if (!opts.sqlAPI) throw new Error('sqlAPI is required');

    this._sqlAPI = opts.sqlAPI;
  }

});
