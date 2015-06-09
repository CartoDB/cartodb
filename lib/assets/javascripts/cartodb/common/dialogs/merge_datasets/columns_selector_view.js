var _ = require('underscore');
var cdb = require('cartodb.js');
var ColumnSelectorView = require('./column_selector_view');

/**
 * View to select an individual column.
 * The selector type is passed to the child view of class ColumnSelectorView.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.options.columnSelectorOptions = this.options.columnSelectorOptions || {};
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.collection.each(this._addColumnSelectorView, this);
    return this;
  },

  _addColumnSelectorView: function(model) {
    var view = new ColumnSelectorView(
      _.extend({
        column: model
      }, this.options.columnSelectorOptions)
    );
    this.addView(view);
    this.$el.append(view.render().$el);
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
  }

});
