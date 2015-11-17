var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var CategoryItemsView = require('./items_view');
var WidgetSearchCategoryItemView = require('./search_item_view');
var placeholder = require('./placeholder.tpl');

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
  }

});
