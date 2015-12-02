var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var Model = require('cdb/core/model');
var PaginatorView = require('./paginator_view');
var searchTemplate = require('./search_paginator_template.tpl');

module.exports = PaginatorView.extend({

  className: 'CDB-Widget-nav is-hidden CDB-Widget-contentSpaced',

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    var pages = Math.ceil(this.dataModel.getSearchCount() / this.options.itemsPerPage);
    this.$el.html(
      searchTemplate({
        showPaginator: true,
        currentPage: this.model.get('page'),
        pages: pages
      })
    );
    this._scrollToPage();

    return this;
  },

  _setPage: function() {
    var count = this.dataModel.getSearchCount();
    var pages = Math.ceil(count / this._ITEMS_PER_PAGE);
    if (this.model.get('page') > (pages - 1)) {
      this.model.set({ page: 0 }, { silent :true });
    }
  },

  toggle: function() {
    this[ !this.viewModel.isSearchEnabled() ? 'hide' : 'show' ]();
  },

  _onSearchClicked: function() {
    this.dataModel.cleanSearch();
    this.viewModel.toggleSearch();
  }

});
