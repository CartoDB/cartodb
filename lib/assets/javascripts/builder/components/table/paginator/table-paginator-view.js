var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./table-paginator.tpl');
var templateLoader = require('./table-paginator-loader.tpl');
var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');

module.exports = CoreView.extend({

  tagName: 'div',
  className: 'Table-paginator js-tablePaginator',

  events: {
    'click .js-prev': '_onPrevPage',
    'click .js-next': '_onNextPage'
  },

  initialize: function (opts) {
    if (!opts.rowsCollection) throw new Error('rowsCollection is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');

    this._tableViewModel = opts.tableViewModel;
    this._rowsCollection = opts.rowsCollection;

    this._rowsCollection.bind('loading', function (item) {
      // Don't take into account row model loading triggers
      if (item.models) {
        this._isLoading = true;
      }
    }, this);
    this._rowsCollection.bind('add remove', this.render, this);
    this._tableViewModel.bind('change:page', this._onTablePageChange, this);
    this.add_related_model(this._tableViewModel);
    this.add_related_model(this._rowsCollection);
  },

  render: function () {
    var rowsSize = this._rowsCollection.size();
    var page = this._tableViewModel.get('page');
    var maxRowsPerPage = this._rowsCollection.DEFAULT_FETCH_OPTIONS.rows_per_page;

    this.$el.html(
      template({
        page: this._tableViewModel.get('page'),
        size: rowsSize,
        isNextAvailable: rowsSize >= maxRowsPerPage,
        isPrevAvailable: page > 0
      })
    );

    this.$el.toggleClass('Table-paginator--relative', !!this._tableViewModel.get('relativePositionated'));
    return this;
  },

  _onTablePageChange: function () {
    this._rowsCollection.fetch({
      data: _.extend(
        this._tableViewModel.pick('page', 'order_by', 'sort_order'),
        {
          exclude: !this._tableViewModel.isCustomQueryApplied() ? ['the_geom_webmercator'] : []
        }
      ),
      error: function (mdl, response) {
        this._isLoading = false;
        this.render();

        Notifier.addNotification({
          status: 'error',
          info: _t('components.table.rows.paginator.error', { error: errorParser(response) }),
          closable: true
        });
      }.bind(this)
    });
  },

  _onPrevPage: function (ev) {
    if (!this._isLoading) {
      this.$('.js-prev').html(templateLoader());
      this._tableViewModel.set('page', this._tableViewModel.get('page') - 1);
    }
  },

  _onNextPage: function (ev) {
    if (!this._isLoading) {
      this.$('.js-next').html(templateLoader());
      this._tableViewModel.set('page', this._tableViewModel.get('page') + 1);
    }
  }

});
