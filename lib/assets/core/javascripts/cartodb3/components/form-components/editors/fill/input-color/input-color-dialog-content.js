var _ = require('underscore');
var CoreView = require('backbone/core-view');
var tabPaneTemplate = require('../fill-tab-pane.tpl');
var createTextLabelsTabPane = require('../../../../../components/tab-pane/create-text-labels-tab-pane');
var ColorPicker = require('../color-picker/color-picker');
var InputColorValueContentView = require('./input-color-value-content-view');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (this.options.editorAttrs) {
      var editorAttrs = this.options.editorAttrs;

      if (editorAttrs.hidePanes) {
        var hidePanes = editorAttrs.hidePanes;
        if (!_.contains(hidePanes, 'value')) {
          if (!opts.configModel) throw new Error('configModel param is required');
          if (!opts.query) throw new Error('query param is required');
        }
      }

      if (editorAttrs.disableOpacity) {
        this._disableOpacity = true;
      }

      if (editorAttrs.categorizeColumns) {
        this._categorizeColumns = true;
      }
    }

    if (!opts.columns) throw new Error('columns is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._query = opts.query;

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
      hidePanes = this.options.editorAttrs.hidePanes;
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
      this.model.unset('domain', { silent: true });
      this.model.unset('bins', { silent: true });
      this.model.unset('attribute', { silent: true });
      this.model.unset('quantification', { silent: true });

      if (!this.model.get('fixed')) {
        if (this.model.get('range')) {
          this.model.set('fixed', this.model.get('range')[0]);
          this.model.unset('range');
        } else {
          this.model.set('fixed', '#0303FF');
        }
      }
    }

    this.trigger('change', selectedTabPaneName, this);
  },

  _generateFixedContentView: function () {
    this._inputView = new ColorPicker({
      value: this.model.get('fixed'),
      opacity: this.model.get('opacity'),
      disableOpacity: this._disableOpacity
    });

    this._inputView.bind('change', this._onChangeValue, this);
    return this._inputView;
  },

  _generateValueContentView: function () {
    return new InputColorValueContentView({
      model: this.model,
      columns: this._columns,
      configModel: this._configModel,
      categorizeColumns: this._categorizeColumns,
      query: this._query
    });
  },

  _onChangeValue: function (color) {
    this.model.set({ fixed: color.hex, opacity: color.opacity });
  }
});
