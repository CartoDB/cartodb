var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var WidgetSearchTitleView = require('./search_title_view');
var WidgetCategoryFilterView = require('./filter_view');
var WidgetCategoryItemsView = require('./items_view');
var WidgetCategoryViewModel = require('./view_model');
var WidgetCategoryInfoView = require('./info_view');
var WidgetCategoryPaginatorView = require('./paginator_view');
var WidgetSearchCategoryItemsView = require('./search_items_view');
var WidgetSearchCategoryPaginatorView = require('./search_paginator_view');
var template = require('./content.tpl');

/**
 * Category content view
 */
module.exports = WidgetContent.extend({

  _ITEMS_PER_PAGE: 6,

  initialize: function(opts) {
    this.viewModel = new WidgetCategoryViewModel();
    this.search = this.model.getSearch();
    WidgetContent.prototype.initialize.call(this, arguments);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      template({
        title: this.model.get('title')
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.viewModel.bind('change:search', this._onToggleSearch, this);
  },

  _onToggleSearch: function() {
    // If search is disabled, get selected items and set them
    // in accept filter. Then reset search.
    var searchEnabled = this.viewModel.isSearchEnabled();
    if (!searchEnabled) {
      /*
        - It should add the selected items to the data model
        - It should add those selected items to the accept collection without
          doing any new request.
        - Clear search model and internal things.
        - Render data list
      */
      var selectedItems = this.search.getSelectedCategories();
      this.filter.accept(selectedItems);
      this.search.resetData();
    }
  },

  _initViews: function() {
    // Title or search
    var searchTitle = new WidgetSearchTitleView({
      model: this.viewModel,
      title: this.model.get('title'),
      search: this.search
    });
    this.$('.js-header').append(searchTitle.render().el);
    this.addView(searchTitle);

    // Stats info
    var info = new WidgetCategoryInfoView({
      model: this.viewModel,
      dataModel: this.model
    });
    this.$('.js-header').append(info.render().el);
    this.addView(info);

    // Selected control
    var filters = new WidgetCategoryFilterView({
      model: this.model,
      viewModel: this.viewModel,
      filter: this.filter
    });
    this.$('.js-content').html(filters.render().el);
    this.addView(filters);

    // Data list view
    var dataList = new WidgetCategoryItemsView({
      model: this.viewModel,
      dataModel: this.model,
      filter: this.filter,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-content').append(dataList.render().el);
    this.addView(dataList);

    // Data paginator
    var pagination = new WidgetCategoryPaginatorView({
      $target: dataList.$el,
      viewModel: this.viewModel,
      dataModel: this.model,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-footer').append(pagination.render().el);
    this.addView(pagination);

    ////////////////////////////////
    // Hello search functionality //
    ////////////////////////////////

    // Search list view
    var searchList = new WidgetSearchCategoryItemsView({
      model: this.viewModel,
      dataModel: this.search,
      filter: this.filter,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-content').append(searchList.render().el);
    this.addView(searchList);

    // Search paginator
    var searchPagination = new WidgetSearchCategoryPaginatorView({
      $target: searchList.$el,
      viewModel: this.viewModel,
      dataModel: this.search,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-footer').append(searchPagination.render().el);
    this.addView(searchPagination);
  }

});
