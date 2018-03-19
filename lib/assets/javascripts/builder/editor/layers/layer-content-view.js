var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var createTextLabelsTabPaneRouted = require('builder/components/tab-pane/create-text-labels-tab-pane-routed');
var TabPaneTemplate = require('./layer-tab-pane.tpl');
var LayerHeaderView = require('./layer-header-view');
var TablesCollection = require('builder/data/tables-collection');
var AnalysisSourceOptionsModel = require('./layer-content-views/analyses/analysis-source-options-model');
var AnalysisFormsCollection = require('./layer-content-views/analyses/analysis-forms-collection');
var TableManager = require('builder/components/table/table-manager');
var changeViewButtons = require('./change-view-buttons.tpl');
var editOverlay = require('./edit-overlay.tpl');
var DataView = require('./layer-content-views/data/data-view');
var LayerContentAnalysesView = require('./layer-content-views/analyses/analyses-view');
var StyleView = require('builder/editor/style/style-view');
var InfowindowsView = require('./layer-content-views/infowindow/infowindows-view');
var LegendsView = require('./layer-content-views/legend/legends-view');
var FeatureDefinitionModel = require('builder/data/feature-definition-model');
var AnalysesService = require('./layer-content-views/analyses/analyses-service');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var Toggler = require('builder/components/toggler/toggler-view');
var Router = require('builder/routes/router');
var fetchAllQueryObjects = require('builder/helpers/fetch-all-query-objects');
var LayerContentModel = require('builder/data/layer-content-model');

var TABS = {
  data: 'data',
  analyses: 'analyses',
  style: 'style',
  popups: 'popups',
  legends: 'legends'
};

var DISABLED_TABS = [
  TABS.style,
  TABS.popups,
  TABS.legends
];

var ROUTER_ADD_GEOMETRY = {
  point: 'addPoint',
  line: 'addLine',
  polygon: 'addPolygon'
};

var CONTEXTS = LayerContentModel.CONTEXTS;

var REQUIRED_OPTS = [
  'userActions',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'layerDefinitionModel',
  'widgetDefinitionsCollection',
  'legendDefinitionsCollection',
  'stackLayoutModel',
  'modals',
  'onboardings',
  'configModel',
  'editorModel',
  'userModel',
  'mapDefinitionModel',
  'mapModeModel',
  'visDefinitionModel',
  'stateDefinitionModel',
  'onboardingNotification'
];

module.exports = CoreView.extend({
  module: 'editor:layers:layer-content-view',

  events: {
    'click .js-back': '_onClickBack',
    'click .js-fix-sql': '_onClickFixSQL'
  },

  options: {
    selectedTabItem: null,
    analysisPayload: null // id or a new analysis node attrs (may not be complete)
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new LayerContentModel({}, {
      querySchemaModel: this._getQuerySchemaModel(),
      queryGeometryModel: this._getQueryGeometryModel(),
      queryRowsCollection: this._getQueryRowsCollection()
    });

    this._initViewState();
    this._onClickNewGeometry = this._onClickNewGeometry.bind(this);

    this._togglerModel = new Backbone.Model({
      labels: [_t('editor.context-switcher.map'), _t('editor.context-switcher.data')],
      active: this._isContextTable()
    });

    AnalysesService.setLayerId(this._layerDefinitionModel.get('id'));

    this._updateViewState();
    this._initBinds();
  },

  render: function () {
    this._unbindEvents();
    this.clearSubViews();
    this._destroyTable();
    this.$el.empty();

    this._renderHeaderView();
    this._renderLayerTabPaneView();

    if (this._isContextTable()) {
      this._initTable();
    }

    this._renderContextButtons();

    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      isLayerEmpty: false,
      canBeGeoreferenced: false,
      isLayerDone: false
    });
    this._setViewState();
  },

  _initBinds: function () {
    var querySchemaModel = this._getQuerySchemaModel();
    var queryRowsCollection = this._getQueryRowsCollection();
    var queryGeometryModel = this._getQueryGeometryModel();
    var layerDefinitionModel = this._layerDefinitionModel;

    this.listenTo(this.model, 'change:context', this._renderContextButtons);
    this.listenTo(this.model, 'change:state', this._updateViewState);
    this.listenTo(this._getAnalysisDefinitionNodeModel(), 'change:error', this.render);

    this.listenTo(layerDefinitionModel, 'remove', this._onClickBack);
    this.listenTo(layerDefinitionModel, 'change:source', this._updateViewState);
    this.listenTo(layerDefinitionModel, 'change:visible', this._renderContextButtons);
    this.listenTo(this._viewState, 'change', this.render);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);

    this.listenTo(this._togglerModel, 'change:active', this._onTogglerChanged);

    this.listenTo(this._widgetDefinitionsCollection, 'add remove', this._renderContextButtons);

    this.listenTo(this._onboardings, 'style', function () {
      this._layerTabPaneView.collection.select('name', 'style');
    });

    this.listenTo(querySchemaModel, 'change:query', function () {
      this._renderContextButtons();

      if (this._editorModel.isEditing()) {
        this.listenToOnce(querySchemaModel, 'sync', function (e) {
          queryRowsCollection.fetch({
            success: function () {
              Router.goToDataTab(layerDefinitionModel.get('id'));
            }
          });
        });
      }
    });

    this.listenToOnce(queryGeometryModel, 'change:simple_geom', function (model, simpleGeom) {
      this._renderContextButtons();
    }, this);

    this.listenTo(Router.getRouteModel(), 'change:currentRoute', this._handleRoute);
  },

  _renderLayerTabPaneView: function () {
    var self = this;
    var analysisPayload = this.options.analysisPayload;
    var layerId = this._layerDefinitionModel.get('id');
    var canBeGeoreferenced = this._viewState.get('canBeGeoreferenced');
    var isDone = this._viewState.get('isLayerDone');
    var isEmpty = this._viewState.get('isLayerEmpty') && isDone;
    var selectedTabItem = this.options.selectedTabItem;
    var analysisFailed = this._getAnalysisDefinitionNodeModel().hasFailed();
    var isDisabled = canBeGeoreferenced || isEmpty || analysisFailed;

    if (isDisabled && (!selectedTabItem || _.contains(DISABLED_TABS, selectedTabItem))) {
      if ((!isEmpty && canBeGeoreferenced) || analysisFailed) {
        selectedTabItem = TABS.analyses;
      } else {
        selectedTabItem = TABS.data;
      }
    }

    var tabPaneTabs = [{
      label: _t('editor.layers.menu-tab-pane-labels.data'),
      name: TABS.data,
      selected: selectedTabItem === TABS.data,
      onClick: function () { Router.goToDataTab(layerId); },
      disabled: false,
      createContentView: function () {
        return new DataView({
          className: 'Editor-content',
          widgetDefinitionsCollection: self._widgetDefinitionsCollection,
          layerDefinitionModel: self._layerDefinitionModel,
          stackLayoutModel: self._stackLayoutModel,
          userActions: self._userActions,
          configModel: self._configModel,
          editorModel: self._editorModel,
          userModel: self._userModel,
          onboardings: self._onboardings,
          onboardingNotification: self._onboardingNotification,
          layerContentModel: self.model
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.analyses'),
      name: TABS.analyses,
      selected: selectedTabItem === TABS.analyses,
      disabled: isEmpty && !analysisFailed,
      onClick: function () { Router.goToAnalysisTab(layerId); },
      createContentView: function () {
        var layerDefinitionModel = self._layerDefinitionModel;
        var analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          tablesCollection: new TablesCollection(null, {
            configModel: self._configModel
          })
        });
        analysisSourceOptionsModel.fetch();

        var analysisFormsCollection = new AnalysisFormsCollection(null, {
          userActions: self._userActions,
          configModel: self._configModel,
          layerDefinitionModel: self._layerDefinitionModel,
          analysisSourceOptionsModel: analysisSourceOptionsModel
        });

        analysisFormsCollection.resetByLayerDefinition();

        if (!self._layerDefinitionModel.hasAnalyses() && canBeGeoreferenced && !analysisPayload) {
          analysisPayload = AnalysesService.generateGeoreferenceAnalysis();
        }

        // e.g. when selected from layers view
        var selectedNodeId;
        if (_.isString(analysisPayload) && analysisFormsCollection.get(analysisPayload)) {
          selectedNodeId = analysisPayload;
        } else if (_.isObject(analysisPayload)) {
          // payload passed after continue when an option was selected in add-analysis-view
          selectedNodeId = analysisPayload.id;
          // Detect when an analysis finishes so we can redirect and / or re-enable the tabs
          self.listenTo(self._analysisDefinitionNodesCollection, 'add', function (model) {
            var nodeSource = model.getPrimarySource();
            // This logic only applies to a geocoding analysis that's the first, on a layer that lacks geocoding
            if (nodeSource && nodeSource.get('type') === 'source' &&
                model.get('type').indexOf('georeference') === 0 &&
                canBeGeoreferenced) {
              var callback = function (model) {
                if (model.isDone() || model.hasFailed()) {
                  this.stopListening(model, 'change:status', callback);
                }

                if (model.isDone()) {
                  Router.goToStyleTab(layerId);
                }

                if (model.hasFailed()) {
                  self.render();
                }
              };

              self.listenTo(model, 'change:status', callback);
            }
          });

          analysisFormsCollection.addHead(analysisPayload);
        } else {
          var lastAnalysisNode = analysisFormsCollection.at(0);

          if (lastAnalysisNode) {
            selectedNodeId = lastAnalysisNode.get('id');
            Router.goToAnalysisNode(layerDefinitionModel.get('id'), selectedNodeId, { trigger: false, replace: true });
          } else {
            Router.goToAnalysisTab(layerDefinitionModel.get('id'), { trigger: false, replace: true });
          }
        }

        // remove payload once we have used it, to not have it being invoked again when switching tabs
        selectedTabItem = null;
        analysisPayload = null;

        return new LayerContentAnalysesView({
          className: 'Editor-content',
          userActions: self._userActions,
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          editorModel: self._editorModel,
          userModel: self._userModel,
          analysisFormsCollection: analysisFormsCollection,
          configModel: self._configModel,
          layerDefinitionModel: self._layerDefinitionModel,
          stackLayoutModel: self._stackLayoutModel,
          selectedNodeId: selectedNodeId,
          onboardings: self._onboardings,
          onboardingNotification: self._onboardingNotification,
          layerContentModel: self.model
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.style'),
      name: TABS.style,
      selected: selectedTabItem === TABS.style,
      layerId: layerId,
      onClick: function () { Router.goToStyleTab(layerId); },
      disabled: isDisabled,
      createContentView: function () {
        // remove payload once we have used it, to not have it being invoked again when switching tabs
        selectedTabItem = null;

        var styleView = new StyleView({
          className: 'Editor-content',
          configModel: self._configModel,
          userModel: self._userModel,
          userActions: self._userActions,
          analysisDefinitionsCollection: self.analysisDefinitionsCollection,
          queryGeometryModel: self._getQueryGeometryModel(),
          querySchemaModel: self._getQuerySchemaModel(),
          queryRowsCollection: self._getQueryRowsCollection(),
          layerDefinitionsCollection: self._layerDefinitionsCollection,
          layerDefinitionModel: self._layerDefinitionModel,
          editorModel: self._editorModel,
          modals: self._modals,
          onboardings: self._onboardings,
          onboardingNotification: self._onboardingNotification,
          layerContentModel: self.model
        });

        return styleView;
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.popups'),
      name: TABS.popups,
      selected: selectedTabItem === TABS.popups,
      onClick: function () { Router.goToPopupsTab(layerId); },
      disabled: isDisabled,
      createContentView: function () {
        var nodeDefModel = self._layerDefinitionModel.getAnalysisDefinitionNodeModel();
        return new InfowindowsView({
          className: 'Editor-content',
          userActions: self._userActions,
          layerDefinitionModel: self._layerDefinitionModel,
          querySchemaModel: nodeDefModel.querySchemaModel,
          editorModel: self._editorModel,
          layerContentModel: self.model
        });
      }
    }, {
      label: _t('editor.layers.menu-tab-pane-labels.legends'),
      name: TABS.legends,
      selected: selectedTabItem === TABS.legends,
      onClick: function () { Router.goToLegendsTab(layerId); },
      disabled: isDisabled,
      createContentView: function () {
        var nodeDefModel = self._layerDefinitionModel.getAnalysisDefinitionNodeModel();
        return new LegendsView({
          className: 'Editor-content',
          mapDefinitionModel: self._mapDefinitionModel,
          userActions: self._userActions,
          layerDefinitionModel: self._layerDefinitionModel,
          querySchemaModel: nodeDefModel.querySchemaModel,
          queryRowsCollection: nodeDefModel.queryRowsCollection,
          legendDefinitionsCollection: self._legendDefinitionsCollection,
          editorModel: self._editorModel,
          userModel: self._userModel,
          configModel: self._configModel,
          modals: self._modals,
          layerContentModel: self.model
        });
      }
    }];

    var tabPaneOptions = {
      tabPaneOptions: {
        className: 'Tab-pane js-editorPanelContent',
        template: TabPaneTemplate,
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

    this._layerTabPaneView = createTextLabelsTabPaneRouted(tabPaneTabs, tabPaneOptions);
    this.$el.append(this._layerTabPaneView.render().el);
    this.addView(this._layerTabPaneView);

    this.listenTo(this._layerTabPaneView.collection, 'change:selected', this._quitEditing, this);
    this._changeStyle();
  },

  _renderHeaderView: function () {
    var analysisDefinitionNodeModel = this._getAnalysisDefinitionNodeModel();
    var tableNodeModel = analysisDefinitionNodeModel.isSourceType() && analysisDefinitionNodeModel.getTableModel();
    var layerHeaderView = new LayerHeaderView({
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      layerDefinitionModel: this._layerDefinitionModel,
      userActions: this._userActions,
      configModel: this._configModel,
      modals: this._modals,
      tableNodeModel: tableNodeModel,
      editorModel: this._editorModel,
      stateDefinitionModel: this._stateDefinitionModel,
      visDefinitionModel: this._visDefinitionModel,
      userModel: this._userModel,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection
    });

    this.addView(layerHeaderView);
    this.$el.append(layerHeaderView.render().$el);
  },

  _updateViewState: function () {
    var setViewStateFn = this._setViewState.bind(this);

    if (this.model.isDone()) {
      setViewStateFn();
      return false;
    }

    this._fetchAllQueryObjects({
      queryRowsCollection: this._getQueryRowsCollection(),
      queryGeometryModel: this._getQueryGeometryModel(),
      querySchemaModel: this._getQuerySchemaModel()
    }).then(function () {
      setViewStateFn();
    });
  },

  _fetchAllQueryObjects: fetchAllQueryObjects.bind(this),

  _destroyTable: function () {
    if (this._tableView) {
      TableManager.destroy(this._tableView);
      delete this._tableView;
    }
  },

  _initTable: function () {
    if (this._tableView) {
      this._destroyTable();
    }

    this._tableView = TableManager.create({
      analysisDefinitionNodeModel: this._getAnalysisDefinitionNodeModel(),
      configModel: this._configModel,
      modals: this._modals,
      userModel: this._userModel
    });

    $('.js-editor .CDB-Dashboard-canvas').append(this._tableView.render().el);
  },

  _isContextTable: function () {
    return this.model.get('context') === CONTEXTS.table;
  },

  _renderContextButtons: function () {
    this._destroyContextButtons();

    var analysisDefinitionNodeModel = this._getAnalysisDefinitionNodeModel();
    var isReadOnly = analysisDefinitionNodeModel.isReadOnly();
    var isVisible = this._layerDefinitionModel.get('visible');
    var queryGeometryModel = this._getQueryGeometryModel();

    $('.CDB-Dashboard-canvas .CDB-Map-canvas').append(
      changeViewButtons({
        context: this.model.get('context'),
        isThereOtherWidgets: this._widgetDefinitionsCollection.isThereOtherWidgets(),
        isThereTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries(),
        isThereAnimatedTimeSeries: this._widgetDefinitionsCollection.isThereTimeSeries({ animated: true }),
        queryGeometryModel: queryGeometryModel.get('simple_geom'),
        isSourceType: analysisDefinitionNodeModel.isSourceType(),
        isVisible: isVisible,
        isReadOnly: isReadOnly
      })
    );

    var togglerView = new Toggler({
      model: this._togglerModel
    });

    $('.js-mapTableView').append(togglerView.render().el);
    $('.js-newGeometry').on('click', this._onClickNewGeometry);
    this._addContextButtonsTooltips(isReadOnly, isVisible);
  },

  _addContextButtonsTooltips: function (isReadOnly, isVisible) {
    if (isReadOnly || !isVisible) {
      var disabledButtonTooltip = new TipsyTooltipView({
        el: $('.js-newGeometryView'),
        title: function () {
          return _t('editor.edit-feature.geometry-disabled');
        }
      });

      this.addView(disabledButtonTooltip);
      return;
    }

    var tooltips = $('.js-newGeometry').map(function () {
      return new TipsyTooltipView({
        el: $(this),
        title: function () {
          return $(this).data('tooltip');
        }
      });
    });

    _.forEach(tooltips, this.addView.bind(this));
  },

  _destroyContextButtons: function () {
    $('.js-newGeometry').off('click', this._onClickNewGeometry);

    $('.js-switchers').remove();
  },

  _onTogglerChanged: function () {
    var context = this._togglerModel.get('active') ? CONTEXTS.table : CONTEXTS.map;

    context === CONTEXTS.table
      ? this._initTable()
      : this._destroyTable();

    this.model.set('context', context);
  },

  _unbindEvents: function () {
    if (this._layerTabPaneView && this._layerTabPaneView.collection) {
      this._layerTabPaneView.collection.off('change:selected', this._quitEditing, this);
    }
  },

  _onClickBack: function () {
    this._editorModel.set({ edition: false });
    Router.goToLayerList();
  },

  _onClickNewGeometry: function (ev) {
    var $target = $(ev.target).closest('.js-newGeometry');
    var featureType = $target.data('feature-type');
    var addGeometry = ROUTER_ADD_GEOMETRY[featureType];

    if ($target.closest('.js-newGeometryItem').hasClass('is-disabled')) return false;

    if (Router[addGeometry]) {
      Router[addGeometry](this._layerDefinitionModel.get('id'));
    }
  },

  _handleRoute: function (routeModel) {
    var currentRoute = routeModel.get('currentRoute');
    var routeName = currentRoute[0];
    var OVERLAY_FADE_MS = 200;

    if (routeName.indexOf('add_feature_') === 0) {
      var featureType = routeName.split('add_feature_')[1];
      var editOverlayText = _t('editor.edit-feature.overlay-text', { featureType: _t('editor.edit-feature.features.' + featureType) });

      $('.CDB-Dashboard-canvas .CDB-Map-canvas').append(editOverlay({
        text: editOverlayText
      }));

      $('.js-editOverlay').fadeIn(OVERLAY_FADE_MS, function () {
        $('.js-editOverlay').removeClass('is-hidden');
      });

      var feature = this._newFeatureDefinitionModel({ featureType: featureType });
      this._mapModeModel.enterDrawingFeatureMode(feature);
      this._stackLayoutModel.goToStep(2, feature.getLayerDefinition(), !feature.isNew());
    }
  },

  _newFeatureDefinitionModel: function (opts) {
    return new FeatureDefinitionModel({}, {
      configModel: this._configModel,
      layerDefinitionModel: this._layerDefinitionModel,
      userModel: this._userModel,
      featureType: opts.featureType
    });
  },

  _onClickFixSQL: function () {
    this._editorModel.set({ edition: true });
    this._layerTabPaneView.getTabPane('data').set({ selected: true });
  },

  _changeStyle: function () {
    this._layerTabPaneView && this._layerTabPaneView.changeStyleMenu(this._editorModel);
  },

  _quitEditing: function () {
    if (this._layerTabPaneView.getSelectedTabPaneName() !== TABS.style &&
        this._layerTabPaneView.getSelectedTabPaneName() !== TABS.popups &&
        this._layerTabPaneView.getSelectedTabPaneName() !== TABS.legends) {
      this._editorModel.set({ edition: false });
    }
  },

  _getAnalysisDefinitionNodeModel: function () {
    return this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
  },

  _getQueryGeometryModel: function () {
    return this._getAnalysisDefinitionNodeModel().queryGeometryModel;
  },

  _getQuerySchemaModel: function () {
    return this._getAnalysisDefinitionNodeModel().querySchemaModel;
  },

  _getQueryRowsCollection: function () {
    return this._getAnalysisDefinitionNodeModel().queryRowsCollection;
  },

  _setViewState: function () {
    var self = this;
    var emptyPromise = this._layerDefinitionModel.isEmptyAsync();
    var geoReferencePromise = this._layerDefinitionModel.canBeGeoreferenced();
    this._viewState.set('isLayerDone', self._layerDefinitionModel.isDone());

    Promise.all([emptyPromise, geoReferencePromise])
      .then(function (values) {
        self._viewState.set({
          isLayerEmpty: values[0],
          canBeGeoreferenced: values[1],
          isLayerDone: self._layerDefinitionModel.isDone()
        });
      });
  },

  clean: function () {
    this._destroyContextButtons();
    this._destroyTable();
    CoreView.prototype.clean.apply(this);
  }
});
