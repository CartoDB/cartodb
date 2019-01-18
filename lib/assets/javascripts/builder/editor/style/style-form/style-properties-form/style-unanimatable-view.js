var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./style-unanimatable.tpl');
var VisTableModel = require('builder/data/visualization-table-model');
var linkTemplate = _.template('<a href="<%- url %>" target="_blank" title="<%- tableName %>"><%- label %></a>');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'configModel'
];

module.exports = CoreView.extend({
  initialize: function (opts) {
    var tableName;

    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._sourceNode = this._getSourceNode();

    if (this._sourceNode) {
      tableName = this._sourceNode.get('table_name');
      this._visTableModel = new VisTableModel({
        id: tableName,
        table: {
          name: tableName
        }
      }, {
        configModel: this._configModel
      });
    }
  },

  render: function () {
    var desc = this._getDescTemplate();

    this.clearSubViews();
    this.$el.html(template({
      title: _t('editor.style.style-form.unanimatable.desc'),
      desc: desc
    }));
    return this;
  },

  _getDescTemplate: function () {
    var tableName = '';
    var url = '';
    var tableModel;

    if (this._visTableModel) {
      tableModel = this._visTableModel.getTableModel();
      tableName = tableModel.getUnquotedName();
      url = this._visTableModel && this._visTableModel.datasetURL();
    }

    var linkHTML = linkTemplate({
      url: url,
      tableName: tableName,
      label: _t('editor.style.style-form.unanimatable.label')
    });

    return _t('editor.style.style-form.unanimatable.body', {
      link: linkHTML
    });
  },

  _getSourceNode: function () {
    var node = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    var source;
    var primarySource;
    if (node.get('type') === 'source') {
      source = node;
    } else {
      primarySource = node.getPrimarySource();
      if (primarySource && primarySource.get('type') === 'source') {
        source = primarySource;
      }
    }

    return source;
  }
});
