var $ = require('jquery');
var cdb = require('cartodb.js');
var ColumnsSelectorView = require('../columns_selector_view');
var TablesSelectorView = require('../tables_selector_view');

/**
 * View to choose the key columns (and implicitly the merge table).
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
        actualTableName: this.model.get('actualTable').get('name')
      })
    );
    this._renderActualColumns($el.find('.js-actual-columns'));
    this._renderMergeTablesSelector($el.find('.js-merge-tables'));
    this._renderMergeColumns($el.find('.js-merge-columns'));
    this.$el.html($el);

    return this;
  },

  _initBinds: function() {
    this.model.get('actualColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.add_related_model(this.model.get('actualColumns'));

    this.model.get('mergeColumns').bind('change:selected', this._onChangeSelectedColumn, this);
    this.model.get('mergeColumns').bind('reset', this._assertIfReadyForNextStep, this);
    this.add_related_model(this.model.get('mergeColumns'));

  },

  _renderActualColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('actualColumns'),
      columnSelectorOptions: {
        selectorType: 'radio',
        className: 'List-row'
      },
      excludeFilter: function(column) {
        return column.get('name') === 'the_geom';
      }
    });
    view.render();
    this.addView(view);
  },

  _renderMergeTablesSelector: function($target) {
    var view = new TablesSelectorView({
      el: $target,
      excludeTableName: this.model.get('actualTable').get('name'),
      table: this.model.get('mergeTable')
    });

    view.model.bind('change:tableData', this._onChangeTableData, this);
    this.add_related_model(view.model);

    view.render();
    this.addView(view);
  },

  _renderMergeColumns: function($target) {
    this._mergeColumnsView = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('mergeColumns'),
      columnSelectorOptions: {
        selectorType: 'radio',
        className: 'List-row'
      },
      excludeFilter: function(column) {
        return column.get('name') === 'the_geom';
      }
    });
    this._mergeColumnsView.render();
    this.addView(this._mergeColumnsView);
  },

  _onChangeSelectedColumn: function(column, isSelected) {
    if (isSelected) { // Only update actual key column if it was selected
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

  _onChangeTableData: function(model, tableData) {
    this.model.get('mergeColumns').reset();
    this.model.set('mergeTableData', tableData);
    this.model.fetchMergeColumns();
  }

});
