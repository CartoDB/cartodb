var $ = require('jquery');
var cdb = require('cartodb.js');
var ColumnsSelectorView = require('../columns_selector_view');
var TablesSelectorView = require('../tables_selector_view');

/**
 * Shared view for both steps of doing a spatial merge, since they are essentially the same
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var rightTableData = this.model.get('rightTableData');

    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/spatial_merge/spatial_merge')({
        leftTableName  : this.model.get('leftTable').get('name'),
        leftKeyColumn  : this.model.get('leftKeyColumn'),
        rightTableName : rightTableData ? rightTableData.name : undefined,
        rightKeyColumn : this.model.get('rightKeyColumn'),
        rightColumns   : this.model.get('rightColumns')
      })
    );

    this._renderLeftColumns($el.find('.js-left-columns'));

    if (rightTableData) {
      this._renderRightColumns($el.find('.js-right-columns'));
      this._renderCalcOptions($el.find('.js-calc-options'));
    } else {
      this._renderRightTablesSelector($el.find('.js-right-tables'));
    }

    this.$el.html($el);
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:rightTableData', this._onChangeRightTableData, this);
  },

  _onChangeRightTableData: function() {
    this.model.fetchRightColumns();
  },

  _renderLeftColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('leftColumns'),
      excludeFilter: this._columnsExcludeFilter,
      columnSelectorOptions: {
        selectorType: 'switch',
        className: 'List-row'
      }
    });
    view.render();
    this.addView(view);
  },

  _renderRightTablesSelector: function($target) {
    var view = new TablesSelectorView({
      el: $target,
      excludeFilter: this._rightTablesExcludeFilter.bind(this)
    });

    view.model.bind('change:tableData', this._onChangeTableData, this);
    this.add_related_model(view.model);

    view.render();
    this.addView(view);
  },

  _renderRightColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('rightColumns'),
      excludeFilter: this._columnsExcludeFilter,
      columnSelectorOptions: {
        selectorType: 'radio',
        className: 'List-row'
      }
    });
    view.render();
    this.addView(view);
  },

  _columnsExcludeFilter: function(column) {
    return column.get('name') === 'the_geom';
  },

  _renderCalcOptions: function($target) {
    // TODO tbd
  },

  _rightTablesExcludeFilter: function(vis) {
    return vis.get('name') === this.model.get('leftTable').get('name');
  },

  _onChangeTableData: function(model, tableData) {
    this.model.set('rightTableData', tableData);
  }

});
