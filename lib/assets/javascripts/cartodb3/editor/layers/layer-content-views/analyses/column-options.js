var _ = require('underscore');
var Backbone = require('backbone');
var QuerySchemaModel = require('../../../../data/query-schema-model');
var QUERY = 'SELECT * FROM <%= table_name %>';

module.exports = Backbone.Model.extend({
  defaults: {
    columnsFetched: false
  },

  initialize: function (attrs, opts) {
    this._configModel = opts.configModel;

    this._querySchemaModel = new QuerySchemaModel(null, {
      configModel: this._configModel
    });

    this._initBinds();

    if (opts.nodeDefModel) {
      this.setNode(opts.nodeDefModel);
    }
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:query', this._fetch);
    this.listenTo(this._querySchemaModel, 'change:status', this._onChangeStatus);
  },

  _fetch: function () {
    this.set('columnsFetched', false);
    this._querySchemaModel.fetch();
  },

  setDataset: function (tableName) {
    var tmpl = _.template(QUERY);

    this._querySchemaModel.set({
      status: null,
      query: tmpl({
        table_name: tableName
      })
    });
  },

  setNode: function (nodeDefModel) {
    this._querySchemaModel.set({
      status: null,
      query: nodeDefModel.querySchemaModel.get('query')
    });
  },

  findColumn: function (columnName, columnType) {
    return _.find(this.filterByType(columnType), function (column) {
      return column.val === columnName;
    }, this);
  },

  all: function () {
    return this.filterByType();
  },

  filterByType: function (columnType) {
    if (!this._querySchemaModel) return [];
    var columns = this._querySchemaModel.columnsCollection.map(function (m) {
      var columnName = m.get('name');
      return {
        val: columnName,
        label: columnName,
        type: m.get('type')
      };
    });

    if (_.isArray(columnType)) {
      columns = columns.filter(function (column) {
        return _.contains(columnType, column.type);
      });
    } else if (columnType) {
      columns = columns.filter(function (column) {
        return column.type === columnType;
      });
    }
    return columns;
  },

  _onChangeStatus: function () {
    if (this._querySchemaModel.get('status') === 'fetching') {
      return;
    } else if (this._querySchemaModel.get('status') === 'fetched') {
      this.set('columnsFetched', true);
      this.trigger('columnsFetched');
    }
  }
});
