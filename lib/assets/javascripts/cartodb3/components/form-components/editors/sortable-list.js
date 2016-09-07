var Backbone = require('backbone');
var _ = require('underscore');
require('jquery-ui');

Backbone.Form.editors.SortableList = Backbone.Form.editors.List.extend({
  initialize: function () {
    Backbone.Form.editors.List.prototype.initialize.apply(this, arguments);
  },

  render: function () {
    Backbone.Form.editors.List.prototype.render.apply(this, arguments);
    this._initSortable();
  },

  _initSortable: function () {
    this.$list.sortable({
      axis: 'y',
      items: 'li',
      placeholder: 'Editor-ListLayer-item Editor-ListLayer-item--placeholder',
      containment: this.$list,
      forceHelperSize: true,
      forcePlaceholderSize: true,
      update: this._onSortableUpdate.bind(this)
    });

    return this;
  },

  _onSortableUpdate: function (event, ui) {
    var sorted = [];
    _.each(this.items, function (item) {
      var index = item.$el.index(this.$list);
      sorted[index] = item;
    });

    this.items = sorted;
  }
});
