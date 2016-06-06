var cdb = require('cartodb.js');
var _ = require('underscore');
var TableBodyRowView = require('./table-body-row-view');
var QueryRowsCollection = require('../../../data/query-rows-collection');
var TablePaginatorView = require('../paginator/table-paginator-view');

/*
 *  Table body view
 */

module.exports = cdb.core.View.extend({

  className: 'Table-body',
  tagName: 'tbody',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel');

    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;
    this._tableViewModel = opts.tableViewModel;

    this.columnsCollection = this._querySchemaModel.columnsCollection;
    this.rowsCollection = new QueryRowsCollection([], {
      querySchemaModel: this._querySchemaModel,
      configModel: this._configModel
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.rowsCollection.each(this._renderBodyRow, this);
    // if (this._tableViewModel.get('page') !== 0) {
      var nextPageTablePaginatorView = new TablePaginatorView({
        rowsCollection: this.rowsCollection,
        tableViewModel: this._tableViewModel
      });
      this.$el.append(nextPageTablePaginatorView.render().el);
      this.addView(nextPageTablePaginatorView);
    // }
    return this;
  },

  _initBinds: function () {
    this.rowsCollection.bind('add reset', _.debounce(this.render.bind(this), 20), this);
    this.add_related_model(this.rowsCollection);
  },

  _renderBodyRow: function (mdl) {
    var view = new TableBodyRowView({
      model: mdl,
      querySchemaModel: this._querySchemaModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }

});
