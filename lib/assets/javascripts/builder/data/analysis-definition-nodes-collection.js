var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisDefinitionNodeSourceModel = require('./analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('./analysis-definition-node-model');
var SQLUtils = require('builder/helpers/sql-utils');
var TableNameUtils = require('builder/helpers/table-name-utils');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

/**
 * Collection of analysis definitions nodes.
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._relatedTableData = opts.relatedTableData || [];

    this._initBinds();
  },

  _initBinds: function () {
    this.on('queryObjectsUpdated', this._onQueryObjectsUpdated);
  },

  addRelatedTableData: function (tableData) {
    this._relatedTableData.push(tableData);
  },

  model: function (r, opts) {
    var self = opts.collection;

    opts = _.extend(
      {
        parse: true,
        configModel: self._configModel,
        userModel: self._userModel
      },
      opts
    );

    if (r.type === 'source') {
      var tableData = _.find(self._relatedTableData, function (t) {
        return TableNameUtils.isSameTableName(r.options.table_name, t.name, self._configModel.get('user_name'));
      });
      if (tableData) {
        opts.tableData = tableData;
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
  },

  _onQueryObjectsUpdated: function (model) {
    this._fetchQueryObjectsIfOnTop(model);
  },

  _fetchQueryObjectsIfOnTop: function (model) {
    if (this._isNodeOnTop(model)) {
      model.fetchQueryObjects();
    }
  },

  _isNodeOnTop: function (model) {
    var currentPos = this.indexOf(model);

    return currentPos === this._getTopNodeIndex();
  },

  _getTopNodeIndex: function () {
    var nodeOnTop = this._getNodeOnTop();
    var at = this.indexOf(nodeOnTop);

    return at;
  },

  _getNodeOnTop: function () {
    return this.last();
  }
});
