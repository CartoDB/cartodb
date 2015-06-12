var $ = require('jquery');
var cdb = require('cartodb.js');
var ColumnsSelectorView = require('../columns_selector_view');
var TablesSelectorView = require('../tables_selector_view');
var MergeMethodView = require('./merge_method_view');

/**
 * Shared view for both steps of doing a spatial merge, since they are essentially the same
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-merge-method': '_onClickMergeMethod',
    'click': 'killEvent'
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var rightTableData = this.model.get('rightTableData');

    var $el = $(
      this.getTemplate('common/dialogs/merge_datasets/spatial_merge/spatial_merge')({
        leftTableName: this.model.get('leftTable').get('name'),
        leftKeyColumn: this.model.get('leftKeyColumn'),
        rightTableName: rightTableData ? rightTableData.name : undefined,
        rightKeyColumn: this.model.get('rightKeyColumn'),
        rightColumns: this.model.get('rightColumns'),
        selectedMergeMethod: this.model.get('selectedMergeMethod')
      })
    );

    this._renderLeftColumns($el.find('.js-left-columns'));

    if (rightTableData) {
      this._renderRightColumns($el.find('.js-right-columns'));
      this._renderMergeMethods($el.find('.js-merge-methods'));
    } else {
      this._renderRightTablesSelector($el.find('.js-right-tables'));
    }

    this.$el.html($el);
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:rightTableData', this._onChangeRightTableData, this);

    var rightColumns = this.model.get('rightColumns');
    rightColumns.bind('change:selected', this._assertIfReadyForNextStep, this);
    this.add_related_model(rightColumns);

    var mergeMethods = this.model.get('mergeMethods');
    if (mergeMethods) {
      mergeMethods.bind('change:selected', this._onChangeSelectedMergeMethod, this);
      this.add_related_model(rightColumns);
    }
  },

  _onChangeRightTableData: function() {
    this.model.fetchRightColumns();
  },

  _onChangeSelectedMergeMethod: function(model, isSelected) {
    if (!isSelected) return;

    var isCountMergeMethod = model.get('name') === 'count';
    this.$('.js-count-merge-method-info').toggle(isCountMergeMethod);
    this.$('.js-right-columns').toggle(!isCountMergeMethod);
    this.model.get('mergeMethods')
      .chain()
      .without(model)
      .each(function(m) {
        m.set('selected', false);
      });
    this._assertIfReadyForNextStep();
  },

  _assertIfReadyForNextStep: function() {
    this.model.assertIfReadyForNextStep();
  },

  _renderLeftColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('leftColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'switch'
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

  _onChangeTableData: function(model, tableData) {
    this.model.set('rightTableData', tableData);
  },

  _renderRightColumns: function($target) {
    var view = new ColumnsSelectorView({
      el: $target,
      collection: this.model.get('rightColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'radio'
    });
    view.render();
    this.addView(view);
  },

  _renderMergeMethods: function($target) {
    $target.append.apply($target, this.model.get('mergeMethods').map(this._$renderedMergeMethod, this));
  },

  _$renderedMergeMethod: function(m) {
    var view = new MergeMethodView({ model: m });
    this.addView(view);
    return view.render().$el;
  },

  _columnsExcludeFilter: function(column) {
    return column.get('name') === 'the_geom';
  },

  _rightTablesExcludeFilter: function(vis) {
    return vis.get('name') === this.model.get('leftTable').get('name');
  },

  _onClickMergeMethod: function(ev) {
    var $btn = $(ev.target).closest('button');
    this.model.set('selectedMergeMethod', $btn.data('merge-method'));

    // Update visual state
    this.$('.js-merge-method').removeClass('selected');
    $btn.addClass('selected');
  }

});
