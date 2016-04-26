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
    this.bind('change:autoStyle', function (m, autoStyle) {
      if (autoStyle) {
        this.each(function (mdl) {
          // Only set if model actually has the attr (i.e. it's a category model)
          if (mdl.dataviewModel && mdl !== m && mdl.dataviewModel.layer.get('layer_name') === m.dataviewModel.layer.get('layer_name') && mdl.get('autoStyle')) {
            mdl.set('autoStyle', false);
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
