var Backbone = require('backbone');
var _ = require('underscore');
var QueryColumnModel = require('./query-column-model');

module.exports = Backbone.Collection.extend({

  model: function (attrs, opts) {
    var self = opts.collection;
    return new QueryColumnModel(attrs, {
      configModel: self._configModel,
      tableName: self._tableName
    });
  },

  url: function () {
    if (this._tableName) {
      var baseUrl = this._configModel.get('base_url');
      var version = this._configModel.urlVersion('column');
      return baseUrl + '/api/' + version + '/tables/' + this._tableName + '/columns';
    }

    return false;
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._tableName = opts.tableName;
    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('add remove change:type change:name', function () {
      this.reset();
      this._querySchemaModel.set('status', 'unfetched');
      this._querySchemaModel.fetch();
    }, this);
    this._querySchemaModel.bind('change:status', function (mdl, status) {
      if (status === 'fetched') {
        this.reset(this._querySchemaModel.columnsCollection.toJSON());
      }
    }, this);
  },

  setTableName: function (name) {
    if (!name) return;

    if (this._tableName) {
      this._tableName = name;

      this.each(function (columnModel) {
        columnModel._tableName = name;
      });
    }
  },

  addColumn: function (opts) {
    opts = opts || {};
    this.create(
      {
        name: 'column_' + new Date().getTime(),
        type: 'string',
        isNew: true
      },
      _.extend(
        opts,
        {
          wait: true,
          parse: false
        }
      )
    );
  }

});
