var CoreView = require('backbone/core-view');
var InfowindowView = require('./infowindow/infowindow-click-view');
var TooltipView = require('./infowindow/infowindow-hover-view');
var createTextLabelsTabPane = require('../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../tab-pane-submenu.tpl');
var popupPlaceholderTemplate = require('./infowindow/popups-placeholder.tpl');
var loadingTemplate = require('../panel-loading-template.tpl');
var _ = require('underscore');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._userActions = opts.userActions;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._editorModel = opts.editorModel;
    this._layerInfowindowModel = this._layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this._layerDefinitionModel.tooltipModel;

    this._editorModel.set({
      edition: false
    });

    this._initBinds();

    if (this._queryGeometryModel.shouldFetch()) {
      this._queryGeometryModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._queryGeometryModel.isFetching()) {
      this._renderLoading();
      return this;
    }

    if (this._layerInfowindowModel && this._hasColumns() && this._canAddInfowindow() && this._queryGeometryModel.hasValue()) {
      this._initViews();
      this._bindEvents();
    } else {
      this._renderPlaceholder();
    }

    return this;
  },

  _initBinds: function () {
    this._queryGeometryModel.bind('change:status', this.render, this);
    this.add_related_model(this._queryGeometryModel);
    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
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

  _canAddInfowindow: function () {
    var styleModel = this._layerDefinitionModel.styleModel;
    return styleModel && !styleModel.isAggregatedType() && !styleModel.isAnimation();
  },

  _renderPlaceholder: function () {
    var placeholder = '';

    if (this._layerInfowindowModel && !this._hasColumns()) {
      placeholder = _t('editor.layers.infowindow.placeholder-columns-text');
    } else if (!this._queryGeometryModel.hasValue()) {
      placeholder = _t('editor.layers.infowindow.placeholder-geometry');
    } else {
      placeholder = _t('editor.layers.infowindow.placeholder-interactivity-text');
    }

    this.$el.append(popupPlaceholderTemplate({
      placeholder: placeholder
    }));
  },

  _renderLoading: function () {
    this.$el.append(loadingTemplate());
  },

  _initViews: function () {
    var self = this;

    var clickTemplate = _t('editor.layers.infowindow.style.none');
    var hoverTemplate = _t('editor.layers.tooltip.style.none');

    if (this._layerInfowindowModel.isCustomTemplate()) {
      clickTemplate = _t('editor.layers.infowindow.style.custom');
    } else if (this._layerInfowindowModel.hasTemplate()) {
      clickTemplate = _t('editor.layers.infowindow.style.' + this._layerInfowindowModel.get('template_name'));
    }

    if (this._layerTooltipModel.isCustomTemplate()) {
      hoverTemplate = _t('editor.layers.tooltip.style.custom');
    } else if (this._layerTooltipModel.hasTemplate()) {
      hoverTemplate = _t('editor.layers.tooltip.style.' + this._layerTooltipModel.get('template_name'));
    }

    var tabPaneTabs = [{
      name: 'click',
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.click'),
      createContentView: function () {
        return new InfowindowView({
          model: self._layerInfowindowModel,
          className: 'Editor-content',
          querySchemaModel: self._querySchemaModel,
          userActions: self._userActions,
          editorModel: self._editorModel,
          layerDefinitionModel: self._layerDefinitionModel
        });
      },
      selectedChild: clickTemplate
    }, {
      name: 'hover',
      label: _t('editor.layers.infowindow-menu-tab-pane-labels.hover'),
      createContentView: function () {
        return new TooltipView({
          className: 'Editor-content',
          querySchemaModel: self._querySchemaModel,
          userActions: self._userActions,
          editorModel: self._editorModel,
          model: self._layerTooltipModel,
          layerDefinitionModel: self._layerDefinitionModel
        });
      },
      selectedChild: hoverTemplate
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
    this._layerTabPaneView && this._layerTabPaneView.changeStyleMenu(m);
  },

  _updateSelectedChild: function () {
    var selectedChild;
    var selectedChildTxt;

    switch (this._layerTabPaneView.getSelectedTabPaneName()) {
      case 'click':
        selectedChild = this._layerInfowindowModel.get('template_name');
        selectedChildTxt = _t('editor.layers.infowindow.style.none');

        if (this._layerInfowindowModel.isCustomTemplate()) {
          selectedChildTxt = _t('editor.layers.infowindow.style.custom');
        } else if (this._layerInfowindowModel.hasTemplate()) {
          selectedChildTxt = _t('editor.layers.infowindow.style.' + selectedChild);
        }

        break;
      case 'hover':
        selectedChild = this._layerTooltipModel.get('template_name');
        selectedChildTxt = _t('editor.layers.tooltip.style.none');

        if (this._layerTooltipModel.isCustomTemplate()) {
          selectedChildTxt = _t('editor.layers.tooltip.style.custom');
        } else if (this._layerTooltipModel.hasTemplate()) {
          selectedChildTxt = _t('editor.layers.tooltip.style.' + selectedChild);
        }

        break;
    }

    this._layerTabPaneView.$('.js-menu .CDB-NavSubmenu-item.is-selected .js-NavSubmenu-status').html(selectedChildTxt);
    this._layerTabPaneView.$('.js-list .Carousel-item').removeClass('is-selected');
    this._layerTabPaneView.$('.js-list .Carousel-item.js-' + selectedChild).addClass('is-selected');
  },

  _bindEvents: function () {
    this._layerInfowindowModel.on('change:template', this._onChangeTemplate, this);
    this.add_related_model(this._layerInfowindowModel);
    this._layerTooltipModel.on('change:template', this._onChangeTemplate, this);
    this.add_related_model(this._layerTooltipModel);
  },

  _onChangeTemplate: function () {
    this._updateSelectedChild();
  }

});
