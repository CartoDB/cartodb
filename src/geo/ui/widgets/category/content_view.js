var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var SearchTitleView = require('./title/search_title_view');
var CategoryOptionsView = require('./options/options_view');
var CategoryItemsView = require('./list/items_view');
var WidgetViewModel = require('../widget_content_model');
var CategoryStatsView = require('./stats/stats_view');
var CategoryPaginatorView = require('./paginator/paginator_view');
var SearchCategoryItemsView = require('./list/search_items_view');
var SearchCategoryPaginatorView = require('./paginator/search_paginator_view');
var template = require('./content_template.tpl');

/**
 * Content view for category widget
 *
 */

module.exports = WidgetContent.extend({

  _ITEMS_PER_PAGE: 6,

  initialize: function(opts) {
    this.viewModel = new WidgetViewModel();
    this.layerModel = opts.layer;
    this.model.set('layerId', this.layerModel.id);
    WidgetContent.prototype.initialize.call(this, arguments);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.viewModel.bind('change:collapsed', function(mdl, isCollapsed) {
      this.$el.toggleClass('is-collapsed', !!isCollapsed);
    }, this);
    this.add_related_model(this.viewModel);
  },

  _initViews: function() {
    var searchTitle = new SearchTitleView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
    this.$('.js-header').append(searchTitle.render().el);
    this.addView(searchTitle);

    var stats = new CategoryStatsView({
      viewModel: this.viewModel,
      dataModel: this.model
    });
    this.$('.js-header').append(stats.render().el);
    this.addView(stats);

    var options = new CategoryOptionsView({
      dataModel: this.model,
      viewModel: this.viewModel
    });
    this.$('.js-content').html(options.render().el);
    this.addView(options);

    var dataList = new CategoryItemsView({
      viewModel: this.viewModel,
      dataModel: this.model,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-content').append(dataList.render().el);
    this.addView(dataList);

    var pagination = new CategoryPaginatorView({
      $target: dataList.$el,
      viewModel: this.viewModel,
      dataModel: this.model,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-footer').append(pagination.render().el);
    this.addView(pagination);

    var searchList = new SearchCategoryItemsView({
      viewModel: this.viewModel,
      dataModel: this.model,
      itemsPerPage: this._ITEMS_PER_PAGE,
      paginator: true
    });
    this.$('.js-content').append(searchList.render().el);
    this.addView(searchList);

    var searchPagination = new SearchCategoryPaginatorView({
      $target: searchList.$el,
      viewModel: this.viewModel,
      dataModel: this.model,
      itemsPerPage: this._ITEMS_PER_PAGE,
      paginator: true
    });
    this.$('.js-footer').append(searchPagination.render().el);
    this.addView(searchPagination);
  }

});
