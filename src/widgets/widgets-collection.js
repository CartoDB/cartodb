var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Collection of Dataviews
 */
module.exports = Backbone.Collection.extend({
  comparator: 'order',

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:order', _.debounce(this._onChangeOrder.bind(this), 10), this);
    // If a category model applies the category colors, rest should remove/disable
    // the category colors applied before.
    this.bind('change:isAutoStyle', function (m, isColorCategorized) {
      if (isColorCategorized) {
        this.each(function (widgetModel) {
          // Only set if model actually has the attr (i.e. it's a category model)
          if (m !== widgetModel && _.isBoolean(widgetModel.get('isAutoStyle'))) {
            widgetModel.set('isAutoStyle', false);
          }
        });
      }
    }, this);
  },

  _onChangeOrder: function () {
    this.sort();
    this.trigger('orderChanged', this);
  }
});
