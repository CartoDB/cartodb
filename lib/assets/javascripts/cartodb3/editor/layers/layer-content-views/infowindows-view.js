var CoreView = require('backbone/core-view');
var InfowindowView = require('./infowindow/infowindow-click-view');
var TooltipView = require('./infowindow/infowindow-hover-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../tab-pane-submenu.tpl');
var popupPlaceholderTemplate = require('./infowindow/popups-placeholder.tpl');
var _ = require('underscore');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._editorModel = opts.editorModel;
    this._layerInfowindowModel = this._layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this._layerDefinitionModel.tooltipModel;

    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    this._unbindEvents();
    this.clearSubViews();
    this.$el.empty();

    if (this._layerInfowindowModel && this._hasColumns() && !this._isAggregated() && !this._isAnimated()) {
      this._initViews();
      this._bindEvents();
    } else {
      this._initPlaceholder();
    }

    return this;
  },

  _hasColumns: function () {
    var self = this;

    if (this._querySchemaModel.get('status') !== 'fetched') return false;

    var columns = this._querySchemaModel.columnsCollection.models;

    var filteredColumns = _(columns).filter(function (c) {
      return !_.contains(self._layerInfowindowModel.SYSTEM_COLUMNS, c.get('name'));
    });

    return filteredColumns.length;
  },

  _isAggregated: function () {
    return this._layerDefinitionModel.styleModel.isAggregatedType();
  },

  _isAnimated: function () {
    return this._layerDefinitionModel.styleModel.isAnimated();
  },

  _initPlaceholder: function () {
    var placeholder = (this._layerInfowindowModel && !this._hasColumns()) ? _t('editor.layers.infowindow.placeholder-columns-text') : _t('editor.layers.infowindow.placeholder-interactivity-text');

    this.$el.append(popupPlaceholderTemplate({
      placeholder: placeholder
    }));
  },

  _initViews: function () {
    var self = this;

    var tabPaneTabs = [{
      name: 'click',
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.click'),
      createContentView: function () {
        return new InfowindowView({
          model: self._layerInfowindowModel,
          className: 'Editor-content',
          querySchemaModel: self._querySchemaModel,
          editorModel: self._editorModel,
          layerDefinitionModel: self._layerDefinitionModel
        });
      },
      selectedChild: this._layerInfowindowModel.hasTemplate() ? _t('editor.layers.infowindow.style.' + this._layerInfowindowModel.get('template_name')) : _t('editor.layers.infowindow.style.none')
    }, {
      name: 'hover',
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.hover'),
      createContentView: function () {
        return new TooltipView({
          className: 'Editor-content',
          querySchemaModel: self._querySchemaModel,
          editorModel: self._editorModel,
          model: self._layerTooltipModel,
          layerDefinitionModel: self._layerDefinitionModel
        });
      },
      selectedChild: this._layerTooltipModel.hasTemplate() ? _t('editor.layers.tooltip.style.' + this._layerTooltipModel.get('template_name')) : _t('editor.layers.tooltip.style.none')
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        template: TabPaneTemplate,
        tabPaneItemOptions: {
          tagName: 'li',
          className: 'CDB-NavSubmenu-item'
        }
      },
      tabPaneItemLabelOptions: {
        tagName: 'button',
        className: 'CDB-NavSubmenu-link u-upperCase'
      }
    };

    this._layerTabPaneView = createTextLabelsTabPane(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);
  },

  _changeStyle: function (m) {
    this._layerTabPaneView.changeStyleMenu(m);
  },

  _updateSelectedChild: function () {
    var selectedChild;

    switch (this._layerTabPaneView.getSelectedTabPaneName()) {
      case 'click':
        selectedChild = this._layerInfowindowModel.hasTemplate() ? _t('editor.layers.infowindow.style.' + this._layerInfowindowModel.get('template_name')) : _t('editor.layers.infowindow.style.none');
        break;
      case 'hover':
        selectedChild = this._layerTooltipModel.hasTemplate() ? _t('editor.layers.tooltip.style.' + this._layerTooltipModel.get('template_name')) : _t('editor.layers.tooltip.style.none');
        break;
    }

    this._layerTabPaneView.$('.js-menu .CDB-NavSubmenu-item.is-selected .js-NavSubmenu-status').html(selectedChild);
  },

  _unbindEvents: function () {
    if (this._layerTabPaneView && this._layerTabPaneView.collection) {
      this._layerTabPaneView.collection.off('change:selected', this._quitEditing, this);
    }
  },

  _bindEvents: function () {
    this._layerTabPaneView.collection.on('change:selected', this._quitEditing, this);
    this.add_related_model(this._layerTabPaneView.collection);
    this._layerInfowindowModel.on('change:template_name', this._onChangeTemplate, this);
    this.add_related_model(this._layerInfowindowModel);
    this._layerTooltipModel.on('change:template_name', this._onChangeTemplate, this);
    this.add_related_model(this._layerTooltipModel);
  },

  _quitEditing: function () {
    this._editorModel.set({edition: false});
  },

  _onChangeTemplate: function () {
    this._updateSelectedChild();

    if (this._editorModel.get('edition') === false) {
      this.render();
    }
  }
});
