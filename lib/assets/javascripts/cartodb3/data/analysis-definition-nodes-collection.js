var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('./analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var Utils = require('../helpers/utils');

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  model: function (r, opts) {
    var self = opts.collection;

    opts = _.extend(
      {
        parse: true,
        configModel: self._configModel
      },
      opts
    );

    return r.type === 'source'
      ? new AnalysisDefinitionNodeSourceModel(r, opts)
      : new AnalysisDefinitionNodeModel(r, opts);
  },

  createSourceNode: function (d) {
    d = d || {};
    if (!d.id) throw new Error('id is required');
    if (!d.tableName) throw new Error('tableName is required');

    return this.add({
      id: d.id,
      type: 'source',
      params: {
        query: d.query || 'SELECT * FROM ' + Utils.safeTableNameQuoting(d.tableName)
      },
      options: {
        table_name: d.tableName
      }
    });
  }

});
