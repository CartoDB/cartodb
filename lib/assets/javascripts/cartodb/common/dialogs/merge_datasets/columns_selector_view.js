var _ = require('underscore');
var cdb = require('cartodb.js');
var ColumnSelectorView = require('./column_selector_view');

/**
 * View to select an individual column.
 * The selector type is passed to the child view of class ColumnSelectorView.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-select-all': '_onClickSelectAll',
    'click': 'killEvent'
  },

  initialize: function() {
    this.options.columnSelectorOptions = this.options.columnSelectorOptions || {};
    this.elder('initialize');
    this.model = new cdb.core.Model({
      showSelectAllToggle: this.options.columnSelectorOptions.selectorType === 'switch' || false
    });
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var chain = this.collection.chain();
    if (this.options.excludeFilter) {
      chain = chain.reject(this.options.excludeFilter);
    }
    chain.each(this._addColumnSelectorView, this);
    this._renderSelectAllToggle();

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

  _renderSelectAllToggle: function() {
    if (this.model.get('showSelectAllToggle')) {
      this.$el.append(
        this.getTemplate('common/dialogs/merge_datasets/select_all_toggle')()
      );
    }
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.collection.bind('change:selected', this._onChangeSelected, this);
  },

  _onChangeSelected: function() {
    this.$('.js-select-all input').prop('checked', this._areAllSelected());
  },

  _onClickSelectAll: function() {
    var invertedAllSelected = !this._areAllSelected();
    this.collection.each(function(m) {
      m.set('selected', invertedAllSelected);
    });
  },

  _areAllSelected: function() {
    return this.collection.all(function(m) {
      return m.get('selected');
    });
  }

});
