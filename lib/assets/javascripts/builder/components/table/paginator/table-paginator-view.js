var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./table-paginator.tpl');
var templateLoader = require('./table-paginator-loader.tpl');
var Notifier = require('builder/components/notifier/notifier');
var errorParser = require('builder/helpers/error-parser');
var QueryUtilsModel = require('builder/helpers/query-utils-model');

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
    this._scrollToBottom = opts.scrollToBottom;
    this._numRows = -1;

    this._queryUtilsModel = opts.queryUtilsModel || new QueryUtilsModel({
      subquery: this._rowsCollection._querySchemaModel.get('query'),
      configModel: this._rowsCollection._configModel
    });

    this._queryUtilsModel.fetchCount(function (numRows) {
      // Check total number of rows to evaluate
      // if there is a next page available
      this._numRows = numRows;
      this.render();
    }.bind(this));

    this._rowsCollection.bind('loading', function (item) {
      // Don't take into account row model loading triggers
      if (item.models) {
        this._isLoading = true;
      }
    }, this);
    this._rowsCollection.bind('add', this._onRowAdded, this);
    this._rowsCollection.bind('remove', this._onRowRemoved, this);
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
        isNextAvailable: this._numRows > (page + 1) * maxRowsPerPage,
        isPrevAvailable: page > 0
      })
    );

    this.$el.toggleClass('Table-paginator--relative', !!this._tableViewModel.get('relativePositionated'));
    return this;
  },

  _onRowAdded: function () {
    this._queryUtilsModel.fetchCount(function (numRows) {
      if (numRows > -1) {
        // Go to the last page
        var maxRowsPerPage = this._rowsCollection.DEFAULT_FETCH_OPTIONS.rows_per_page;
        var lastPage = Math.ceil(numRows / maxRowsPerPage) - 1;
        if (lastPage !== this._tableViewModel.get('page')) {
          this._tableViewModel.set('page', lastPage);
        } else {
          this.render();
        }
        setTimeout(this._scrollToBottom, 200);
      }
    }.bind(this));
  },

  _onRowRemoved: function () {
    this._rowsCollection.fetch({
      data: this._getData()
    });
  },

  _onTablePageChange: function () {
    this._rowsCollection.fetch({
      data: this._getData(),
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

  _getData: function () {
    return _.extend(
      this._tableViewModel.pick('page', 'order_by', 'sort_order'),
      {
        exclude: !this._tableViewModel.isCustomQueryApplied() ? ['the_geom_webmercator'] : []
      }
    );
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
