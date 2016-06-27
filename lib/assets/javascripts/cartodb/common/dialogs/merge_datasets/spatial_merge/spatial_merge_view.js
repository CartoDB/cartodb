var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ColumnsSelectorView = require('../columns_selector_view');
var TablesSelectorView = require('../tables_selector_view');
var MergeMethodView = require('./merge_method_view');
var StickyHeaderView = require('../sticky_header_view');
var FooterView = require('../footer_view');
var FooterInfoView = require('./footer_info_view');

/**
 * Shared view for both steps of doing a spatial merge, since they are essentially the same
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initViews();
    this._initBinds();
  },

  render: function() {
    var hasSelectedRightTable = this._hasSelectedRightTable();

    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/spatial_merge/spatial_merge')({
        leftKeyColumn: this.model.get('leftKeyColumn'),
        hasSelectedRightTable: hasSelectedRightTable,
        rightKeyColumn: this.model.get('rightKeyColumn'),
        rightColumns: this.model.get('rightColumns')
      })
    );

    $el.find('.js-left-table').append(this._leftTableComboView.render().$el);
    $el.find('.js-left-columns').append(this._leftColumnsView.render().$el);
    $el.find('.js-right-columns').append(this._rightColumnsView.render().$el);
    $el.append(this._footerView.render().$el);

    if (hasSelectedRightTable) {
      $el.find('.js-sticky-header').append(this._stickyHeaderView.render().$el);
      $el.find('.js-right-table').append(this._rightTableComboView.render().$el);
      this._renderMergeMethods($el.find('.js-merge-methods'));
    } else {
      $el.find('.js-right-tables').append(this._rightTablesSelectorView.render().$el);
    }

    this.$el.html($el);

    return this;
  },

  onChangeKeyColumnsVisiblity: function() {
    if (this._hasSelectedRightTable()) {
      this._stickyHeaderView.$el.slideToggle(200);
    }
  },

  _hasSelectedRightTable: function() {
    return _.isObject(this.model.get('rightTableData'));
  },

  _initViews: function() {
    this._leftTableComboView = new cdb.forms.Combo({
      className: 'Select',
      width: '100%',
      disabled: true,
      extra: [this.model.get('leftTable').get('name')]
    });
    this.addView(this._leftTableComboView);

    this._leftColumnsView = new ColumnsSelectorView({
      collection: this.model.get('leftColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'switch'
    });
    this.addView(this._leftColumnsView);

    var footerInfoView; // only set for 2nd step
    var rightTableData = this.model.get('rightTableData');
    if (rightTableData) {
      this._stickyHeaderView = new StickyHeaderView({
        leftKeyColumn: this.model.get('leftKeyColumn'),
        rightKeyColumn: this.model.get('rightKeyColumn'),
        addRadioPlaceholder: true
      });
      this.addView(this._stickyHeaderView);

      this._rightTableComboView = new cdb.forms.Combo({
        className: 'Select',
        width: '100%',
        disabled: true,
        extra: [this.model.get('rightTableData').name]
      });
      this.addView(this._rightTableComboView);
      footerInfoView = new FooterInfoView({
        model: this.model
      })
    } else {
      this._rightTablesSelectorView = new TablesSelectorView({
        excludeFilter: this._rightTablesExcludeFilter.bind(this),
        initialOption: {
          label: rightTableData ? rightTableData.name : 'Select dataset'
        }
      });
      this.addView(this._rightTablesSelectorView);
    }

    this._rightColumnsView = new ColumnsSelectorView({
      collection: this.model.get('rightColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'radio'
    });
    this.addView(this._rightColumnsView);

    this._mergeMethodViews = this.model.get('mergeMethods').map(this._createMergeMethodView, this);

    this._footerView = new FooterView({
      model: this.model,
      nextLabel: rightTableData ? 'Merge datasets' : undefined,
      infoView: footerInfoView
    });
    this.addView(this._footerView);
  },

  _createMergeMethodView: function(m) {
    var view = new MergeMethodView({ model: m });
    this.addView(view);
    return view;
  },

  _initBinds: function() {
    var rightColumns = this.model.get('rightColumns');
    rightColumns.bind('change:selected', this._onChangeSelectedRightColumn, this);
    this.add_related_model(rightColumns);

    var mergeMethods = this.model.get('mergeMethods');
    if (mergeMethods) {
      mergeMethods.bind('change:selected', this._onChangeSelectedMergeMethod, this);
      this.add_related_model(mergeMethods);
    }

    if (this._rightTablesSelectorView) {
      this._rightTablesSelectorView.model.bind('change:tableData', this._onChangeRightTableData, this);
      this.add_related_model(this._rightTablesSelectorView.model);
    }
  },

  _onChangeRightTableData: function(m, tableData) {
    this._rightColumnsView.model.set('loading', 'columns');
    this.model.fetchRightColumns(tableData);
  },

  _onChangeSelectedRightColumn: function(m, isSelected) {
    if (isSelected) {
      this.model.changedRightMergeColumn(m);
    }
  },

  _onChangeSelectedMergeMethod: function(m, isSelected) {
    if (!isSelected) return;

    this.model.changedSelectedMergeMethod(m);

    var isCountMergeMethod = this.model.isCountMergeMethod(m);
    this.$('.js-count-merge-method-info').toggle(isCountMergeMethod);
    this.$('.js-right-columns').toggle(!isCountMergeMethod);
  },

  _renderMergeMethods: function($target) {
    $target.append.apply($target, this._$renderedMergeMethodViews());
  },

  _$renderedMergeMethodViews: function() {
    return _.map(this._mergeMethodViews, function(view) {
      return view.render().$el;
    });
  },

  _columnsExcludeFilter: function(column) {
    return column.get('name') === 'the_geom';
  },

  _rightTablesExcludeFilter: function(vis) {
    return vis.get('name') === this.model.get('leftTable').get('name');
  }

});
