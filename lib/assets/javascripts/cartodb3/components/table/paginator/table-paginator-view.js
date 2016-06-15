var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./table-paginator.tpl');
var templateLoader = require('./table-paginator-loader.tpl');

module.exports = CoreView.extend({

  tagName: 'div',
  className: 'Table-paginator',

  events: {
    'click .js-prev': '_onPrevPage',
    'click .js-next': '_onNextPage',
    'click button': '_onButtonClick'
  },

  initialize: function (opts) {
    if (!opts.rowsCollection) throw new Error('rowsCollection is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');

    this._tableViewModel = opts.tableViewModel;
    this._rowsCollection = opts.rowsCollection;

    this._rowsCollection.bind('loading', function () {
      this._isLoading = true;
    }, this);
    this._tableViewModel.bind('change:page', this._onTablePageChange, this);
    this.add_related_model(this._tableViewModel);
  },

  render: function () {
    var rowsSize = this._rowsCollection.size();
    var page = this._tableViewModel.get('page');

    this.$el.html(
      template({
        page: this._tableViewModel.get('page'),
        size: rowsSize,
        isNextAvailable: rowsSize > 0,
        isPrevAvailable: page > 0
      })
    );
    return this;
  },

  _onTablePageChange: function () {
    this._rowsCollection.fetch({
      data: _.extend(
        this._tableViewModel.pick('page', 'order_by', 'sort_order'),
        {
          exclude: this._tableViewModel.isCustomQueryApplied() ? ['the_geom_webmercator'] : []
        }
      )
    });
  },

  _onPrevPage: function () {
    if (!this._isLoading) {
      this._tableViewModel.set('page', this._tableViewModel.get('page') - 1);
    }
  },

  _onNextPage: function () {
    if (!this._isLoading) {
      this._tableViewModel.set('page', this._tableViewModel.get('page') + 1);
    }
  },

  _onButtonClick: function (ev) {
    $(ev.target).html(templateLoader());
  }

});
