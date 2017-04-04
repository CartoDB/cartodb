var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var InfowindowView = require('./infowindow-click-view');
var TooltipView = require('./infowindow-hover-view');
var createTextLabelsTabPane = require('../../../../components/tab-pane/create-text-labels-tab-pane');
var TabPaneTemplate = require('../../../tab-pane-submenu.tpl');
var popupPlaceholderTemplate = require('./popups-placeholder.tpl');
var georeferencePlaceholderTemplate = require('./georeference-placeholder.tpl');
var loadingTemplate = require('../../panel-loading-template.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var Infobox = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var PanelWithOptionsView = require('../../../../components/view-options/panel-with-options-view');
var ViewFactory = require('../../../../components/view-factory');
var panelTemplate = require('./panel-with-options.tpl');
var OverlayView = require('../../../components/overlay/overlay-view');
var fetchAllQueryObjectsIfNecessary = require('../../../../helpers/fetch-all-query-objects');

var REQUIRED_OPTS = [
  'configModel',
  'userActions',
  'layerDefinitionModel',
  'queryGeometryModel',
  'querySchemaModel',
  'queryRowsCollection',
  'editorModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._layerInfowindowModel = this._layerDefinitionModel.infowindowModel;
    this._layerTooltipModel = this._layerDefinitionModel.tooltipModel;

    this._initModels();
    this._initBinds();

    this._fetchAllQueryObjectsIfNecessary();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._queryGeometryModel.isFetching()) {
      this._renderLoading();
    } else if (this._layerInfowindowModel && this._hasColumns() && this._canAddInfowindow() && this._queryGeometryModel.hasValue()) {
      this._initViews();
      this._bindEvents();
    } else {
      this._renderPlaceholder();
    }

    this._renderOverlay();
    return this;
  },

  _renderOverlay: function () {
    var view = new OverlayView({
      overlayModel: this._overlayModel
    });
    this.addView(view);
    this.$('.js-content').append(view.render().el);
  },

  _initModels: function () {
    this._infoboxModel = new InfoboxModel({
      state: this._isLayerHidden() ? 'layer-hidden' : ''
    });

    this._overlayModel = new Backbone.Model({
      visible: this._isLayerHidden()
    });

    this._editorModel.set({
      edition: false
    });
  },

  _isLayerHidden: function () {
    return this._layerDefinitionModel.get('visible') === false;
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryGeometryModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._queryRowsCollection.statusModel, 'change:status', this._onStatusChanged);
    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);

    // If there is a change in the node query (we check queryGeometryModel because is the last query element set)
    // we should fetch all objects (necessary in this case)
    this.listenTo(this._queryGeometryModel, 'change:query', function () {
      this._queryGeometryModel.set('status', 'unfetched');
      this._fetchAllQueryObjectsIfNecessary();
    });
  },

  _fetchAllQueryObjectsIfNecessary: function () {
    fetchAllQueryObjectsIfNecessary({
      queryRowsCollection: this._queryRowsCollection,
      queryGeometryModel: this._queryGeometryModel,
      querySchemaModel: this._querySchemaModel
    });
  },

  _onStatusChanged: function () {
    if (this._querySchemaModel.isFetched() &&
        this._queryGeometryModel.isFetched() &&
        this._queryRowsCollection.isFetched()) {
      this.render();
    }
  },

  _hasColumns: function () {
    if (!this._querySchemaModel.isFetched()) return false;

    var columns = this._querySchemaModel.columnsCollection.models;

    var filteredColumns = _(columns).filter(function (c) {
      return !_.contains(this._layerInfowindowModel.SYSTEM_COLUMNS, c.get('name'));
    }, this);

    return filteredColumns.length;
  },

  _canAddInfowindow: function () {
    var styleModel = this._layerDefinitionModel.styleModel;
    return styleModel && !styleModel.isAggregatedType() && !styleModel.isAnimation();
  },

  _renderPlaceholder: function () {
    if (this._layerInfowindowModel && !this._hasColumns()) {
      this.$el.append(popupPlaceholderTemplate({
        placeholder: _t('editor.layers.infowindow.placeholder-columns-text')
      }));
    } else if (!this._queryGeometryModel.hasValue()) {
      if (this._layerDefinitionModel.canBeGeoreferenced()) {
        this._renderGeoreferencePlaceholder();
      } else {
        this.$el.append(popupPlaceholderTemplate({
          placeholder: _t('editor.layers.infowindow.placeholder-geometry')
        }));
      }
    } else {
      this.$el.append(popupPlaceholderTemplate({
        placeholder: _t('editor.layers.infowindow.placeholder-interactivity-text')
      }));
    }
  },

  _renderGeoreferencePlaceholder: function () {
    var self = this;

    var infoboxSstates = [
      {
        state: 'layer-hidden',
        createContentView: function () {
          return Infobox.createWithAction({
            type: 'alert',
            title: _t('editor.infowindow.messages.layer-hidden.title'),
            body: _t('editor.infowindow.messages.layer-hidden.body'),
            mainAction: {
              label: _t('editor.infowindow.messages.layer-hidden.show')
            }
          });
        },
        mainAction: self._showHiddenLayer.bind(self)
      }
    ];

    var infoboxCollection = new InfoboxCollection(infoboxSstates);

    var panelWithOptionsView = new PanelWithOptionsView({
      template: panelTemplate,
      className: 'Editor-content',
      editorModel: self._editorModel,
      infoboxModel: self._infoboxModel,
      infoboxCollection: infoboxCollection,
      createContentView: function () {
        return ViewFactory.createByHTML(georeferencePlaceholderTemplate());
      }
    });

    this.$el.append(panelWithOptionsView.render().el);
    this.addView(panelWithOptionsView);
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
  },

  _showHiddenLayer: function () {
    var savingOptions = {
      shouldPreserveAutoStyle: true
    };
    this._layerDefinitionModel.toggleVisible();
    this._userActions.saveLayer(this._layerDefinitionModel, savingOptions);
  }
});
