var _ = require('underscore');
var Backbone = require('backbone');
var QuerySchemaModel = require('../../../../data/query-schema-model');
var QUERY = 'SELECT <%= column %> FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY <%= column %> ASC';
var MAX_ROW_COUNT = 30;

module.exports = Backbone.Model.extend({
  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.nodeDefModel) throw new Error('nodeDefModel param is required');

    this._configModel = opts.configModel;
    this._nodeDefModel = opts.nodeDefModel;

    this._initBinds();
    this._setColumn();
  },

  _initBinds: function () {
    this._querySchemaModel = new QuerySchemaModel(null, {
      configModel: this._configModel
    });

    this._query = this._nodeDefModel.querySchemaModel.get('query');
    this.listenTo(this._querySchemaModel, 'change:status', this._onChangeStatus);
    this.on('change:column', this._onChangeColumn, this);
  },

  _onChangeColumn: function () {
    this._setColumn();
    this.fetch();
  },

  _onChangeStatus: function () {
    if (this._querySchemaModel.get('status') === 'fetching') {
      return;
    }

    var resultCount = this._querySchemaModel.rowsSampleCollection.size();

    if (resultCount && resultCount < MAX_ROW_COUNT) {
      var results = this._querySchemaModel.rowsSampleCollection.pluck(this.get('column'));
      this.trigger('columnsFetched', results);
    }
  },

  _setColumn: function () {
    var tmpl = _.template(QUERY);
    this._querySchemaModel.set({
      status: null,
      query: tmpl({
        sql: this._query,
        column: this.get('column')
      })
    });
  },

  fetch: function () {
    this._querySchemaModel.set('status', null);
    this._querySchemaModel.fetch();
  },

  getRows: function () {
    if (this._querySchemaModel && this._querySchemaModel.rowsSampleCollection) {
      var resultCount = this._querySchemaModel.rowsSampleCollection.size();

      if (resultCount && resultCount < MAX_ROW_COUNT) {
        return this._querySchemaModel.rowsSampleCollection.pluck(this.get('column'));
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
});
