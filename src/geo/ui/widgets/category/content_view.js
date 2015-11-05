var _ = require('underscore');
var WidgetContent = require('../standard/widget_content_view');
var WidgetCategoryFilterView = require('./filter_view');
var WidgetCategoryItemsView = require('./items_view');
var WidgetCategoryPaginatorView = require('./paginator_view');
var template = require('./content.tpl');

/**
 * Category content view
 */
module.exports = WidgetContent.extend({

  _ITEMS_PER_PAGE: 6,

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

  // Reset category content bindings and move that logic to category list view
  _initBinds: function() {},

  _initViews: function() {
    // Selected control
    var filters = new WidgetCategoryFilterView({
      model: this.model,
      filter: this.filter
    });
    this.$('.js-content').html(filters.render().el);
    this.addView(filters);

    // List view -> items view
    var list = new WidgetCategoryItemsView({
      model: this.model,
      filter: this.filter,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-content').append(list.render().el);
    this.addView(list);

    // Paginator
    var pagination = new WidgetCategoryPaginatorView({
      $target: list.$el,
      dataModel: this.model,
      itemsPerPage: this._ITEMS_PER_PAGE
    });
    this.$('.js-footer').append(pagination.render().el);
    this.addView(pagination);
  }

});
