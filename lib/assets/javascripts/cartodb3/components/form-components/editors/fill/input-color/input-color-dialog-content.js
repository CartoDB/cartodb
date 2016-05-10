var _ = require('underscore');
var cdb = require('cartodb.js');
var tabPaneTemplate = require('../fill-tab-pane.tpl');
var createTextLabelsTabPane = require('../../../../../components/tab-pane/create-text-labels-tab-pane');
var ColorPickerView = require('../color-picker/color-picker');
var InputColorValueContentView = require('./input-color-value-content-view');

var rampList = require('../input-ramp/ramps');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;

    var self = this;

    var fixedPane = {
      name: 'fixed',
      label: _t('form-components.editors.fill.input-color.solid'),
      createContentView: function () {
        return self._generateFixedContentView();
      }
    };

    var valuePane = {
      name: 'value',
      label: _t('form-components.editors.fill.input-color.value'),
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
    this._tabPaneView.collection.bind('change:selected', this._onChangeTabPaneViewTab, this);
  },

  render: function () {
    this.$el.append(this._tabPaneView.render().$el);
    return this;
  },

  _onChangeTabPaneViewTab: function () {
    var selectedTabPaneName = this._tabPaneView.getSelectedTabPaneName();

    if (selectedTabPaneName === 'fixed') {
      if (this.model.get('range')) {
        this.model.set('fixed', this.model.get('range')[0]);
        this.model.unset('range');
      }
    } else {
      if (this.model.get('fixed')) {
        this.model.set('range', this._getDefaultRamp());
        this.model.unset('fixed');
      }
    }

    this.trigger('change', selectedTabPaneName, this);
  },

  _getDefaultRamp: function () {
    return _.map(rampList, function (ramp) {
      return ramp[3];
    }, this)[0];
  },

  _generateFixedContentView: function () {
    this._inputView = new ColorPickerView({
      value: this.model.get('fixed')
    });

    this._inputView.bind('change', this._onChangeValue, this);
    return this._inputView;
  },

  _generateValueContentView: function () {
    return new InputColorValueContentView({
      model: this.model,
      columns: this._columns
    });
  },

  _onChangeValue: function (color) {
    this.model.set('fixed', color);
  }
});
