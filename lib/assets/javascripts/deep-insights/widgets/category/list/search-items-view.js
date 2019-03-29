var CategoryItemsView = require('./items-view');
var WidgetSearchCategoryItemView = require('./item/search-item-view');
var placeholder = require('./search-items-no-results-template.tpl');

/**
 * Category list view
 */
module.exports = CategoryItemsView.extend({
  className: 'CDB-Widget-list is-hidden js-list',

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var data = this._searchResultsCollection;
    var isDataEmpty = data.isEmpty() || data.size() === 0;

    if (isDataEmpty) {
      this._renderPlaceholder();
    } else {
      this._renderList();
    }
    return this;
  },

  _initBinds: function () {
    CategoryItemsView.prototype._initBinds.apply(this, arguments);
    this._searchResultsCollection = this._dataviewModel.getSearchResult();
    this.listenTo(this._searchResultsCollection, 'change:selected', this._onSelectedItemChange);
    this.listenTo(this._searchResultsCollection, 'reset', this.render);
  },

  _getData: function () {
    return this._searchResultsCollection;
  },

  _renderPlaceholder: function () {
    this.$el.addClass('CDB-Widget-list--noresults');

    this.$el.html(
      placeholder({
        q: this._dataviewModel.getSearchQuery()
      })
    );
  },

  _addItem: function (model) {
    var view = new WidgetSearchCategoryItemView({
      model: model,
      widgetModel: this._widgetModel,
      dataviewModel: this._dataviewModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  toggle: function () {
    this[this._widgetModel.isSearchEnabled() ? 'show' : 'hide']();
  },

  _onSelectedItemChange: function (model, isSelected) {
    this._widgetModel.lockedCategories[isSelected ? 'addItem' : 'removeItem'](model);
  }
});
