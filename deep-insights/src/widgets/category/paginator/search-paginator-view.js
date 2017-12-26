var PaginatorView = require('./paginator-view');
var searchTemplate = require('./search-paginator-template.tpl');

module.exports = PaginatorView.extend({
  className: 'CDB-Widget-nav is-hidden CDB-Widget-contentSpaced',

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var pages = Math.ceil(this.dataviewModel.getSearchCount() / this.options.itemsPerPage);
    this.$el.html(
      searchTemplate({
        showPaginator: (pages > 1),
        currentPage: this.model.get('page'),
        pages: pages
      })
    );
    this._scrollToPage();

    return this;
  },

  _setPage: function () {
    var count = this.dataviewModel.getSearchCount();
    var pages = Math.ceil(count / this._ITEMS_PER_PAGE);
    if (this.model.get('page') > (pages - 1)) {
      this.model.set({ page: 0 }, { silent: true });
    }
  },

  toggle: function () {
    this[ !this.widgetModel.isSearchEnabled() ? 'hide' : 'show' ]();
  },

  _onSearchClicked: function () {
    this.widgetModel.cleanSearch();
    this.widgetModel.toggleSearch();
  }

});
