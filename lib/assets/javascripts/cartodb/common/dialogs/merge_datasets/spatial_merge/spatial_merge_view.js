var $ = require('jquery');
var _ = require('underscore');
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
    this._initViews();
    this._initBinds();
  },

  render: function() {
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

    $el.find('.js-left-columns').append(this._leftColumnsView.render().$el);
    if (rightTableData) {
      $el.find('.js-right-columns').append(this._rightColumnsView.render().$el);
      this._renderMergeMethods($el.find('.js-merge-methods'));
    } else {
      $el.find('.js-right-tables').append(this._rightTablesSelectorView.render().$el);
      this._renderMergeMethodsDesc($el.find('.js-merge-methods-desc'));
    }

    this.$el.html($el);
    return this;
  },

  _initViews: function() {
    this._leftColumnsView = new ColumnsSelectorView({
      collection: this.model.get('leftColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'switch'
    });
    this.addView(this._leftColumnsView);

    this._rightTablesSelectorView = new TablesSelectorView({
      excludeFilter: this._rightTablesExcludeFilter.bind(this),
      initialOption: {
        label: 'Select dataset'
      }
    });
    this.addView(this._rightTablesSelectorView);

    this._rightColumnsView = new ColumnsSelectorView({
      collection: this.model.get('rightColumns'),
      excludeFilter: this._columnsExcludeFilter,
      selectorType: 'radio'
    });
    this.addView(this._rightColumnsView);

    this._mergeMethodViews = this.model.get('mergeMethods').map(this._createMergeMethodView, this);
  },

  _createMergeMethodView: function(m) {
    var view = new MergeMethodView({ model: m });
    this.addView(view);
    return view;
  },

  _initBinds: function() {
    var rightColumns = this.model.get('rightColumns');
    rightColumns.bind('change:selected', this._assertIfReadyForNextStep, this);
    this.add_related_model(rightColumns);

    var mergeMethods = this.model.get('mergeMethods');
    if (mergeMethods) {
      mergeMethods.bind('change:selected', this._onChangeSelectedMergeMethod, this);
      this.add_related_model(rightColumns);
    }

    this._rightTablesSelectorView.model.bind('change:tableData', this._onChangeRightTableData, this);
    this.add_related_model(this._rightTablesSelectorView.model);
  },

  _onChangeRightTableData: function(m, tableData) {
    this.model.fetchRightColumns(tableData);
  },

  _onChangeSelectedMergeMethod: function(m, isSelected) {
    if (!isSelected) return;

    var isCountMergeMethod = m.name === 'count';
    this.$('.js-count-merge-method-info').toggle(isCountMergeMethod);
    this.$('.js-right-columns').toggle(!isCountMergeMethod);
    this.model.deselectAllMergeMethodsExcept(m);
    this._assertIfReadyForNextStep();
  },

  _assertIfReadyForNextStep: function() {
    this.model.assertIfReadyForNextStep();
  },

  _renderMergeMethods: function($target) {
    $target.append.apply($target, this._$renderedMergeMethodViews());
  },

  _$renderedMergeMethodViews: function() {
    return _.map(this._mergeMethodViews, function(view) {
      return view.render().$el;
    });
  },

  _renderMergeMethodsDesc: function($target) {
    $target.append.apply($target,
      this.model.get('mergeMethods')
      .chain()
      .zip(this._$renderedMergeMethodViews())
      .map(function(pair) {
        var mergeMethodDesc = pair[0].desc;
        return [
          pair[1], // rendered merge view $el
          this.make('p', { class: 'DefaultParagraph' }, mergeMethodDesc)
        ];
      }, this)
      .flatten()
      .value()
    );
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
