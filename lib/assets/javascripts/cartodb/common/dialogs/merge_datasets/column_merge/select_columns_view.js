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
        actualTableName: this.model.get('actualTable').get('name'),
        actualKeyColumn: this.model.get('actualKeyColumn'),
        mergeKeyColumn: this.model.get('mergeKeyColumn'),
        mergeTableName: this.model.get('mergeTableData').name
      })
    );
    this._renderActualColumns($el.find('.js-actual-columns'));
    this._renderMergeColumns($el.find('.js-merge-columns'));
    this.$el.html($el);

    return this;
  },

  _initBinds: function() {
    this.model.get('actualColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.add_related_model(this.model.get('actualColumns'));

    this.model.get('mergeColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.add_related_model(this.model.get('mergeColumns'));
  },

  _onChangeSelectedColumn: function(column, isSelected) {
    this.model.onlyAllowOneSelectedTheGeomColumn(column, isSelected);
  },

  _renderActualColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('actualColumns'),
      columnSelectorOptions: {
        selectorType: 'switch',
        className: 'List-row'
      }
    });
    view.render();
    this.addView(view);
  },

  _renderMergeColumns: function($target) {
    this._mergeColumnsView = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('mergeColumns'),
      columnSelectorOptions: {
        selectorType: 'switch',
        className: 'List-row'
      }
    });
    this._mergeColumnsView.render();
    this.addView(this._mergeColumnsView);
  }

});
