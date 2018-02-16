var _ = require('underscore');
var CoreView = require('backbone/core-view');
var tabPaneTemplate = require('builder/components/form-components/editors/fill/fill-tab-pane.tpl');
var createTextLabelsTabPane = require('builder/components/tab-pane/create-text-labels-tab-pane');
var InputNumberFixedContentView = require('./input-number-fixed-content-view');
var InputNumberValueContentView = require('./input-number-value-content-view');

var DEFAULT_INPUT_MIN_VALUE = 0;
var DEFAULT_INPUT_MAX_VALUE = 100;
var DEFAULT_INPUT_STEP_VALUE = 1;

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns param is required');
    this._columns = opts.columns;

    this.listenTo(this.model, 'change:attribute', this._updateRangeValue);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
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
          klassName: 'CDB-NavMenu-item'
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
    this.listenTo(this._tabPaneView.collection, 'change:selected', this._onChangeTabPaneViewTab);
    this.addView(this._tabPaneView);
    this.$el.append(this._tabPaneView.render().$el);
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
      // when coming from range calculate the average
      var r = this.model.get('range');
      var avg = 0.5 * (+r[0] + +r[1]);
      this.model.set('fixed', avg);
      this.model.unset('range');
    }
  },

  _updateRangeValue: function () {
    if (this.model.get('fixed') !== null && this.model.get('fixed') !== undefined && this.model.get('attribute')) {
      var editorAttrs = this.options.editorAttrs;
      var range = (editorAttrs && editorAttrs.defaultRange) || [this.model.get('fixed'), this.model.get('fixed')];
      this.model.set('range', range);
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
