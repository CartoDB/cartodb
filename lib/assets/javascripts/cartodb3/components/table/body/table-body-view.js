var CoreView = require('backbone/core-view');
var _ = require('underscore');
var TableBodyRowView = require('./table-body-row-view');
var TablePaginatorView = require('../paginator/table-paginator-view');

/*
 *  Table body view
 */

module.exports = CoreView.extend({

  className: 'Table-body',
  tagName: 'div',

  events: {
    'click .js-nextPage': '_onNextPageClick',
    'click .js-previousPage': '_onPrevPageClick'
  },

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.rowsCollection) throw new Error('rowsCollection is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel');

    this._tableViewModel = opts.tableViewModel;
    this._querySchemaModel = opts.querySchemaModel;

    this.columnsCollection = opts.columnsCollection;
    this.rowsCollection = opts.rowsCollection;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this.$el.append('<table><tbody class="js-tbody"></tbody></table>');

    if (this._tableViewModel.get('page') > 0) {
      this.$('.js-tbody').prepend('<tr><td><button class="js-previousPage">prev page</button></td></tr>');
    }

    this.rowsCollection.each(this._renderBodyRow, this);

    if (this.rowsCollection.size() === 40) {
      this.$('.js-tbody').append('<tr><td><button class="js-nextPage">next page</button></td></tr>');
    }

    return this;
  },

  _initBinds: function () {
    this.rowsCollection.bind('add reset', _.debounce(this.render.bind(this), 20), this);
    this.add_related_model(this.rowsCollection);
  },

  _renderBodyRow: function (mdl) {
    var view = new TableBodyRowView({
      model: mdl,
      columnsCollection: this.columnsCollection,
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this._tableViewModel
    });
    this.addView(view);
    this.$('.js-tbody').append(view.render().el);
  },

  _onPrevPageClick: function () {
    this._tableViewModel.set('page', this._tableViewModel.get('page') - 1);

    this.rowsCollection.fetch({
      data: this._tableViewModel.pick('page', 'order_by', 'sort_order')
    });
  },

  _onNextPageClick: function () {
    this._tableViewModel.set('page', this._tableViewModel.get('page') + 1);

    this.rowsCollection.fetch({
      data: this._tableViewModel.pick('page', 'order_by', 'sort_order')
    });
  }

});
