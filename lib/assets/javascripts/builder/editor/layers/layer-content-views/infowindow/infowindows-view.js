var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var InfowindowClickView = require('./infowindow-click-view');
var TooltipView = require('./infowindow-hover-view');
var createTextLabelsTabPane = require('builder/components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('builder/editor/tab-pane-submenu.tpl');
var popupPlaceholderTemplate = require('./popups-placeholder.tpl');
var layerTabMessageTemplate = require('builder/editor/layers/layer-tab-message.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'userActions',
  'layerDefinitionModel',
  'querySchemaModel',
  'editorModel',
  'layerContentModel'
];

module.exports = CoreView.extend({
  module: 'infowindows-view',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initViewState();
    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._viewState.get('isDataFiltered')) {
      this._renderFilteredData();
    } else if (this._isNotAggregatedType() && this._hasColumns()) {
      this._initViews();
    } else {
      this._renderPlaceholder();
    }

    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      isDataFiltered: false
    });

    this._setViewValues();
  },

  _initModels: function () {
    this._layerInfowindowModel = this._layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this._layerDefinitionModel.tooltipModel;

    this._editorModel.set({
      edition: false
    });
  },

  _initBinds: function () {
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.listenTo(this._layerInfowindowModel, 'change:template', this._updateSelectedChild);
    this.listenTo(this._layerTooltipModel, 'change:template', this._updateSelectedChild);
    this.listenTo(this._layerContentModel, 'change:state', this._setViewValues);
    this.listenTo(this._viewState, 'change:isDataFiltered', this.render);
    this.listenTo(this._querySchemaModel, 'change:status', this.render);
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
        return new InfowindowClickView({
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
          klassName: 'CDB-NavSubmenu-item'
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

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _hasColumns: function () {
    var columns = this._querySchemaModel.columnsCollection.models;

    var filteredColumns = _(columns).filter(function (c) {
      return !_.contains(this._layerInfowindowModel.SYSTEM_COLUMNS, c.get('name'));
    }, this);

    return filteredColumns.length;
  },

  _isNotAggregatedType: function () {
    var styleModel = this._layerDefinitionModel.styleModel;
    return this._layerInfowindowModel && styleModel && !styleModel.isAggregatedType() && !styleModel.isAnimation();
  },

  _renderPlaceholder: function () {
    if (this._layerInfowindowModel && !this._hasColumns()) {
      this.$el.append(popupPlaceholderTemplate({
        placeholder: _t('editor.layers.infowindow.placeholder-columns-text')
      }));
    } else {
      this.$el.append(popupPlaceholderTemplate({
        placeholder: _t('editor.layers.infowindow.placeholder-interactivity-text')
      }));
    }
  },

  _renderFilteredData: function () {
    this.$el.append(
      layerTabMessageTemplate({
        message: _t('editor.layers.warnings.no-data.message'),
        action: _t('editor.layers.warnings.no-data.action-message')
      })
    );
  },

  _changeStyle: function (model) {
    if (this._layerTabPaneView) { this._layerTabPaneView.changeStyleMenu(model); }
  },

  _updateSelectedChild: function () {
    // TODO: Move to tabPaneView
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

  _showHiddenLayer: function () {
    var savingOptions = {
      shouldPreserveAutoStyle: true
    };
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel, savingOptions);
  },

  _setViewValues: function () {
    this._layerDefinitionModel.isDataFiltered()
      .then(function (isDataFiltered) {
        this._viewState.set('isDataFiltered', isDataFiltered);
      }.bind(this));
  }
});
