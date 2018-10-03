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
    return this;
  },

  addItem: function () {
    Backbone.Form.editors.List.prototype.addItem.apply(this, arguments);
    this._updateEditability();
    return this;
  },

  removeItem: function () {
    Backbone.Form.editors.List.prototype.removeItem.apply(this, arguments);
    this._updateEditability();
    return this;
  },

  _initSortable: function () {
    this.$list.sortable({
      axis: 'y',
      items: '.js-sortable',
      tolerance: 'pointer',
      containment: this.$list,
      forceHelperSize: true,
      forcePlaceholderSize: true,
      update: this._onSortableUpdate.bind(this)
    });
  },

  _onSortableUpdate: function (event, ui) {
    var sorted = [];
    var list = this.$list;
    var items = this.items;

    _.each(items, function (item) {
      var index = item.$el.index(list.$el);
      sorted[index] = item;
    });

    this.items = sorted;
    this.commit();
  },

  _updateEditability: function () {
    if (this.items.length > 1) {
      this.$('.js-sortable').addClass('is-movable');
      this.$('.js-editable').removeClass('is-hidden');
    } else {
      this.$('.js-sortable').removeClass('is-movable');
      this.$('.js-editable').addClass('is-hidden');
    }
  }
});
