var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var CategoryItemsView = require('./items_view');
var WidgetSearchCategoryItemView = require('./search_item_view');
var placeholder = require('./search_items_no_results_template.tpl');

/**
 * Category list view
 */
module.exports = CategoryItemsView.extend({

  className: 'Widget-list is-hidden Widget-list--wrapped js-list',

  initialize: function() {
    this.originModel = this.options.originModel;
    CategoryItemsView.prototype.initialize.call(this);
  },

  _addItem: function(mdl, $parent) {
    var v = new WidgetSearchCategoryItemView({
      model: mdl,
      dataModel: this.originModel
    });
    this.addView(v);
    $parent.append(v.render().el);
  },

  toggle: function() {
    this[ this.model.isSearchEnabled() ? 'show' : 'hide']();
  },

  _renderList: function() {
    this.$el.removeClass('Widget-list--noresults')
    CategoryItemsView.prototype._renderList.call(this);
  },

  _renderPlaceholder: function() {
    // Change view classes
    this.$el
      .addClass('Widget-list--noresults')
      .removeClass('Widget-list--wrapped');

    this.$el.html(
      placeholder({
        q: this.dataModel.get('q')
      })
    );
  },

});
