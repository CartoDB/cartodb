var _ = require('underscore');
var Backbone = require('backbone');
var QuerySchemaModel = require('../../../../data/query-schema-model');

var queryTemplate = _.template('SELECT min(<%= column %>) as min, max(<%= column %>) as max FROM (<%= sql %>) _table_sql');

module.exports = Backbone.Model.extend({
  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.nodeDefModel) throw new Error('nodeDefModel param is required');

    this._configModel = opts.configModel;
    this._nodeDefModel = opts.nodeDefModel;

    this._querySchemaModel = new QuerySchemaModel(null, {
      configModel: this._configModel
    });

    this._query = this._nodeDefModel.querySchemaModel.get('query');

    this._initBinds();
    this._setColumn();
  },

  _initBinds: function () {
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

    if (this._querySchemaModel.rowsCollection.size() > 0) {
      var results = this._querySchemaModel.rowsCollection.models[0];
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
  }
});
