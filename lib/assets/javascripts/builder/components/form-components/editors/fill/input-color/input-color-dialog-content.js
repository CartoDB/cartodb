var _ = require('underscore');
var CoreView = require('backbone/core-view');
var tabPaneTemplate = require('builder/components/form-components/editors/fill/fill-tab-pane.tpl');
var createTextLabelsTabPane = require('builder/components/tab-pane/create-text-labels-tab-pane');
var InputColorFixedContentView = require('./input-color-fixed-content-view');
var InputColorValueContentView = require('./input-color-value-content-view');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (this.options.editorAttrs) {
      var editorAttrs = this.options.editorAttrs;

      if (editorAttrs.hidePanes) {
        this._hidePanes = editorAttrs.hidePanes;

        if (!_.contains(this._hidePanes, 'value')) {
          if (!opts.configModel) throw new Error('configModel param is required');
          if (!opts.userModel) throw new Error('userModel param is required');
          if (!opts.modals) throw new Error('modals param is required');
          if (!opts.query) throw new Error('query param is required');
        }
      }

      if (editorAttrs.categorizeColumns) {
        this._categorizeColumns = true;
      }

      if (editorAttrs.hideTabs) {
        this._hideTabs = editorAttrs.hideTabs;
      }

      if (editorAttrs.imageEnabled) {
        this._imageEnabled = true;
      }
    }

    if (!opts.columns) throw new Error('columns is required');

    this._columns = opts.columns;
    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
    this._query = opts.query;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.model.on('change:fixed', this._onChangeFixed, this);
  },

  _onChangeFixed: function () {
    if (!this.model.get('fixed') || this.model.get('range')) {
      this.model.unset('image', { silent: true });
      this.model.unset('images', { silent: true });
    }
  },

  _initViews: function () {
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

    if (this._hidePanes) {
      if (!_.contains(this._hidePanes, 'fixed')) {
        this._tabPaneTabs.push(fixedPane);
      }
      if (!_.contains(this._hidePanes, 'value')) {
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
    this._tabPaneView.collection.bind('change:selected', this._onChangeTabPaneViewTab, this);
    this.$el.append(this._tabPaneView.render().$el);
    this.addView(this._tabPaneView);
  },

  _onChangeTabPaneViewTab: function () {
    var selectedTabPaneName = this._tabPaneView.getSelectedTabPaneName();
    var attrsToUnsetIfFixed = ['domain', 'bins', 'attribute', 'quantification'];

    if (selectedTabPaneName === 'fixed') {
      _.each(attrsToUnsetIfFixed, function (attr) {
        this.model.unset(attr, { silent: true });
      }, this);

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
    return new InputColorFixedContentView({
      model: this.model,
      configModel: this._configModel,
      userModel: this._userModel,
      modals: this._modals,
      editorAttrs: this.options.editorAttrs
    });
  },

  _generateValueContentView: function () {
    return new InputColorValueContentView({
      model: this.model,
      columns: this._columns,
      configModel: this._configModel,
      categorizeColumns: this._categorizeColumns,
      imageEnabled: this._imageEnabled,
      userModel: this._userModel,
      modals: this._modals,
      hideTabs: this._hideTabs,
      query: this._query
    });
  }
});
