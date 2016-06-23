var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  initialize: function (attrs, opts) {
    if (opts && opts.nodeDefModel) {
      this._nodeDefModel = opts.nodeDefModel;
      this._initBinds();
    }
  },

  setNode: function (node) {
    this._nodeDefModel = node;
    this._initBinds();
  },

  _initBinds: function () {
    this._querySchemaModel = this._nodeDefModel.querySchemaModel;
    this.listenTo(this._querySchemaModel, 'change:status', this._onChangeStatus);
    this._querySchemaModel.fetch();
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

    if (columnType) {
      columns = columns.filter(function (column) {
        return column.type === columnType;
      });
    }
    return columns;
  },

  _onChangeStatus: function () {
    if (this._querySchemaModel.get('status') === 'fetching') {
      return;
    }

    this.trigger('columnsFetched');
  }
});
