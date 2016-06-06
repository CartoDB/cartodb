var _ = require('underscore');
var cdb = require('cartodb.js');
var tabPaneTemplate = require('../fill-tab-pane.tpl');
var createTextLabelsTabPane = require('../../../../../components/tab-pane/create-text-labels-tab-pane');
var InputNumberFixedContentView = require('./input-number-fixed-content-view');
var InputNumberValueContentView = require('./input-number-value-content-view');

var DEFAULT_INPUT_MIN_VALUE = 0;
var DEFAULT_INPUT_MAX_VALUE = 100;
var DEFAULT_INPUT_STEP_VALUE = 1;

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    this._columns = opts.columns;

    this._initViews();
    this._initBindings();
  },

  render: function () {
    this.$el.append(this._tabPaneView.render().$el);
    return this;
  },

  _initViews: function () {
    var self = this;

    var fixedPane = {
      name: 'fixed',
      label: _t('form-components.editors.fill.input-number.fixed'),
      createContentView: function () {
        return self._generateFixedContentView();
      }
    };

    var valuePane = {
      name: 'value',
      label: _t('form-components.editors.fill.input-number.value'),
      createContentView: function () {
        return self._generateValueContentView();
      }
    };

    this._tabPaneTabs = [];

    if (this.options.editorAttrs && this.options.editorAttrs.hidePanes) {
      var hidePanes = this.options.editorAttrs.hidePanes;
      if (!_.contains(hidePanes, 'fixed')) {
        this._tabPaneTabs.push(fixedPane);
      }
      if (!_.contains(hidePanes, 'value')) {
        this._tabPaneTabs.push(valuePane);
      }
    } else {
      this._tabPaneTabs = [fixedPane, valuePane];
    }

    var tabPaneOptions = {
      tabPaneOptions: {
        template: tabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavMenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavMenu-link u-upperCase'
      }
    };

    if (this.model.get('range') && this._tabPaneTabs.length > 1) {
      this._tabPaneTabs[1].selected = true;
    }

    this._tabPaneView = createTextLabelsTabPane(this._tabPaneTabs, tabPaneOptions);
    this.addView(this._tabPaneView);
  },

  _initBindings: function () {
    this._tabPaneView.collection.bind('change:selected', this._onChangeTabPaneViewTab, this);
    this.model.bind('change:attribute', this._updateRangeValue, this);
  },

  _onChangeTabPaneViewTab: function () {
    var selectedTabPaneName = this._tabPaneView.getSelectedTabPaneName();

    if (selectedTabPaneName === 'fixed') {
      this._updateFixedValue();
    } else {
      this._updateRangeValue();
    }

    this.trigger('change', selectedTabPaneName, this);
  },

  _updateFixedValue: function () {
    if (this.model.get('range')) {
      this.model.set('fixed', this.model.get('range')[0]);
      this.model.unset('range');
    }
  },

  _updateRangeValue: function () {
    if (this.model.get('fixed') !== null && this.model.get('fixed') !== undefined && this.model.get('attribute')) {
      this.model.set('range', [this.model.get('fixed'), this.model.get('fixed')]);
      this.model.unset('fixed');
    }
  },

  _generateFixedContentView: function () {
    var editorAttrs = this.options.editorAttrs;
    return new InputNumberFixedContentView({
      model: this.model,
      min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
      max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE,
      step: (editorAttrs && editorAttrs.step) || DEFAULT_INPUT_STEP_VALUE
    });
  },

  _generateValueContentView: function () {
    var editorAttrs = this.options.editorAttrs;
    return new InputNumberValueContentView({
      model: this.model,
      columns: this._columns,
      min: (editorAttrs && editorAttrs.min) || DEFAULT_INPUT_MIN_VALUE,
      max: (editorAttrs && editorAttrs.max) || DEFAULT_INPUT_MAX_VALUE
    });
  },

  _onChangeValue: function (input) {
    this.model.set('fixed', input.value);
  }
});
