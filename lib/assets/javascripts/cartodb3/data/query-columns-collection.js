var Backbone = require('backbone');
var _ = require('underscore');
var QueryColumnModel = require('./query-column-model');

module.exports = Backbone.Collection.extend({

  model: function (attrs, opts) {
    var self = opts.collection;
    return new QueryColumnModel(attrs, {
      configModel: self._configModel,
      analysisDefinitionNodeModel: self._analysisDefinitionNodeModel
    });
  },

  url: function () {
    var tableName = this._analysisDefinitionNodeModel.get('table_name');

    if (tableName) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('column');
      return baseUrl + '/api/' + version + '/tables/' + this._analysisDefinitionNodeModel.get('table_name') + '/columns';
    }

    return false;
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('add', function () {
      this._querySchemaModel.fetch({ force: true });
    }, this);
    this._querySchemaModel.bind('change:status', function (mdl, status) {
      if (status === 'fetched') {
        this.reset(this._querySchemaModel.columnsCollection.toJSON());
      }
    }, this);
  },

  addColumn: function (opts) {
    opts = opts || {};
    this.create(
      {
        type: 'string',
        name: 'column_' + new Date().getTime()
      },
      _.extend(
        opts,
        {
          wait: true,
          parse: true
        }
      )
    );
  }

});
