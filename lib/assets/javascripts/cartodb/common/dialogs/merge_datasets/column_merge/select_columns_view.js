var $ = require('jquery');
var cdb = require('cartodb.js');
var ColumnsSelectorView = require('../columns_selector_view');

/**
 * View to select the columns to merge.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/column_merge/select_columns')({
        leftTableName: this.model.get('leftTable').get('name'),
        leftKeyColumn: this.model.get('leftKeyColumn'),
        rightKeyColumn: this.model.get('rightKeyColumn'),
        rightTableName: this.model.get('rightTableData').name
      })
    );
    this._renderLeftColumns($el.find('.js-left-columns'));
    this._renderRightColumns($el.find('.js-right-columns'));
    this.$el.html($el);

    return this;
  },

  _initBinds: function() {
    this.model.get('leftColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.add_related_model(this.model.get('leftColumns'));

    this.model.get('rightColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.add_related_model(this.model.get('rightColumns'));
  },

  _onChangeSelectedColumn: function(column, isSelected) {
    this.model.onlyAllowOneSelectedTheGeomColumn(column, isSelected);
  },

  _renderLeftColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('leftColumns'),
      columnSelectorOptions: {
        selectorType: 'switch',
        className: 'List-row'
      }
    });
    view.render();
    this.addView(view);
  },

  _renderRightColumns: function($target) {
    this._rightColumnsView = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('rightColumns'),
      columnSelectorOptions: {
        selectorType: 'switch',
        className: 'List-row'
      }
    });
    this._rightColumnsView.render();
    this.addView(this._rightColumnsView);
  }

});
