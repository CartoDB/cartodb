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
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/column_merge/choose_key_columns')({
        leftTableName: this.model.get('leftTable').get('name')
      })
    );
    this._renderLeftColumns($el.find('.js-left-columns'));
    this._renderRightTablesSelector($el.find('.js-right-tables'));
    this._renderRightColumns($el.find('.js-right-columns'));
    this.$el.html($el);

    return this;
  },

  _initBinds: function() {
    this.model.get('leftColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.add_related_model(this.model.get('leftColumns'));

    this.model.get('rightColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.model.get('rightColumns').bind('reset', this._assertIfReadyForNextStep, this);
    this.add_related_model(this.model.get('rightColumns'));
  },

  _renderLeftColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('leftColumns'),
      excludeFilter: this._leftColumnsExcludeFilter,
      columnSelectorOptions: {
        selectorType: 'radio',
        className: 'List-row'
      }
    });
    view.render();
    this.addView(view);
  },

  _leftColumnsExcludeFilter: function(column) {
    return column.get('name') === 'the_geom';
  },

  _renderRightTablesSelector: function($target) {
    var view = new TablesSelectorView({
      el: $target,
      excludeFilter: this._rightTablesExcludeFilter.bind(this)
    });

    view.model.bind('change:tableData', this._onChangeRightTableData, this);
    this.add_related_model(view.model);

    view.render();
    this.addView(view);
  },

  _rightTablesExcludeFilter: function(vis) {
    return vis.get('name') === this.model.get('leftTable').get('name');
  },

  _renderRightColumns: function($target) {
    this._rightColumnsView = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('rightColumns'),
      columnSelectorOptions: {
        selectorType: 'radio',
        className: 'List-row'
      },
      excludeFilter: function(column) {
        return column.get('name') === 'the_geom';
      }
    });
    this._rightColumnsView.render();
    this.addView(this._rightColumnsView);
  },

  _onChangeSelectedColumn: function(column, isSelected) {
    if (isSelected) { // Only update left key column if it was selected
      this._unselectAllExcept(column.collection, column);
      this._assertIfReadyForNextStep();
    }
  },

  _unselectAllExcept: function(columnsCollection, exceptColumn) {
    columnsCollection.chain()
      .reject(function(m) {
        return m === exceptColumn;
      })
      .each(function(m) {
        m.unset('selected');
      });
  },

  _assertIfReadyForNextStep: function() {
    this.model.assertIfReadyForNextStep();
  },

  _onChangeRightTableData: function(model, tableData) {
    this.model.get('rightColumns').reset();
    this.model.set('rightTableData', tableData);
    this.model.fetchRightColumns();
  }

});
