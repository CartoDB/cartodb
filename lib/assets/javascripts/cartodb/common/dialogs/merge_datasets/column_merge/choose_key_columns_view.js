var $ = require('jquery');
var cdb = require('cartodb.js');
var ColumnsSelectorView = require('../columns_selector_view');
var TablesSelectorView = require('../tables_selector_view');

/**
 * View to choose the key columns (and implicitly the right table).
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.elder('initialize');
    this._initViews();
    this._initBinds();
  },

  render: function() {
    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/column_merge/choose_key_columns')({
        leftTableName: this.model.get('leftTable').get('name')
      })
    );
    $el.find('.js-left-columns').append(this._leftColumnsView.render().$el);
    $el.find('.js-right-tables').append(this._rightTableSelectorView.render().$el);
    $el.find('.js-right-columns').append(this._rightColumnsView.render().$el);
    this.$el.html($el);

    return this;
  },

  _initViews: function() {
    this._leftColumnsView = new ColumnsSelectorView({
      collection: this.model.get('leftColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'radio'
    });
    this.addView(this._leftColumnsView);

    this._rightTableSelectorView = new TablesSelectorView({
      excludeFilter: this._rightTablesExcludeFilter.bind(this)
    });
    this.addView(this._rightTableSelectorView);

    this._rightColumnsView = new ColumnsSelectorView({
      collection: this.model.get('rightColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'radio'
    });
    this.addView(this._rightColumnsView);
  },

  _columnsExcludeFilter: function(column) {
    return column.get('name') === 'the_geom';
  },

  _rightTablesExcludeFilter: function(vis) {
    return vis.get('name') === this.model.get('leftTable').get('name');
  },

  _initBinds: function() {
    var leftColumns = this.model.get('leftColumns');
    leftColumns.bind('change:selected', this._assertIfReadyForNextStep, this);
    this.add_related_model(leftColumns);

    var rightColumns = this.model.get('rightColumns');
    rightColumns.bind('change:selected', this._assertIfReadyForNextStep, this);
    rightColumns.bind('reset', this._assertIfReadyForNextStep, this);
    this.add_related_model(rightColumns);

    var rightTablesModel = this._rightTableSelectorView.model;
    rightTablesModel.bind('change:tableData', this._onChangeRightTableData, this);
    this.add_related_model(rightTablesModel);
  },

  _assertIfReadyForNextStep: function() {
    this.model.assertIfReadyForNextStep();
  },

  _onChangeRightTableData: function(model, tableData) {
    this.model.changeRightTable(tableData);
  }

});
