var _ = require('underscore');
var Backbone = require('backbone');
var QuerySchemaModel = require('../../../../data/query-schema-model');

var queryTemplate = _.template('SELECT <%= column %> FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY <%= column %> ASC');
var MAX_ROW_COUNT = 100;

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

    var resultCount = this._querySchemaModel.rowsCollection.size();

    if (resultCount && resultCount < MAX_ROW_COUNT) {
      var results = this._querySchemaModel.rowsCollection.pluck(this.get('column'));
      this.trigger('columnsFetched', results);
    }
  },

  _setColumn: function () {
    if (!this.get('column')) {
      return;
    }

    this._querySchemaModel.set({
      rows_per_page: 40,
      query: queryTemplate({
        sql: this._query,
        column: this.get('column')
      })
    });
  },

  fetch: function () {
    if (this.get('column')) {
      this._querySchemaModel.set('status', null);
      this._querySchemaModel.fetch();
    }
  },

  getRows: function () {
    if (this._querySchemaModel && this._querySchemaModel.rowsCollection) {
      var resultCount = this._querySchemaModel.rowsCollection.size();

      if (resultCount && resultCount < MAX_ROW_COUNT) {
        var rows = this._querySchemaModel.rowsCollection.pluck(this.get('column'));
        return _.reject(rows, _.isNull);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
});
