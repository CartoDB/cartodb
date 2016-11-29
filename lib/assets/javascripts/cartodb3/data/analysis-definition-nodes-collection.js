var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('./analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var SQLUtils = require('../helpers/sql-utils');
var TableNameUtils = require('../helpers/table-name-utils');

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this._relatedTableModels = opts.relatedTableModels || [];
  },

  addRelatedTableModel: function (tableModel) {
    this._relatedTableModels.push(tableModel);
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

    if (r.type === 'source') {
      var tableModel = _.find(self._relatedTableModels, function (t) {
        return TableNameUtils.isSameTableName(r.options.table_name, t.get('name'), self._configModel.get('user_name'));
      });
      if (tableModel) {
        opts.tableModel = tableModel;
      }
      return new AnalysisDefinitionNodeSourceModel(r, opts);
    } else {
      return new AnalysisDefinitionNodeModel(r, opts);
    }
  },

  createSourceNode: function (d) {
    d = d || {};
    if (!d.id) throw new Error('id is required');
    if (!d.tableName) throw new Error('tableName is required');

    return this.add({
      id: d.id,
      type: 'source',
      params: {
        query: d.query || SQLUtils.getDefaultSQL(d.tableName, TableNameUtils.getUsername(d.tableName), true)
      },
      options: {
        table_name: d.tableName
      }
    });
  }

});
