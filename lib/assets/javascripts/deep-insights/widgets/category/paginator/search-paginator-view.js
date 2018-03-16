var PaginatorView = require('./paginator-view');
var searchTemplate = require('./search-paginator-template.tpl');
var paginationTemplate = require('./pagination-template.tpl');

module.exports = PaginatorView.extend({
  className: 'CDB-Widget-nav is-hidden CDB-Widget-contentSpaced',

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var pages = this._totalPages();

    this.$el.html(searchTemplate());

    if (pages > 1) {
      this.$el.append(paginationTemplate({
        currentPage: this._paginatorModel.get('page'),
        pages: pages
      }));
    }
    return this;
  },

  _totalPages: function () {
    return Math.ceil(this._dataviewModel.getSearchCount() / this.options.itemsPerPage);
  },

  toggle: function () {
    this[ !this._widgetModel.isSearchEnabled() ? 'hide' : 'show' ]();
  },

  _onSearchClicked: function () {
    this._widgetModel.cleanSearch();
    this._widgetModel.toggleSearch();
  }
});
