var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
if (ACTIVE_LOCALE !== 'en') {
  require('moment/locale/' + ACTIVE_LOCALE);
}
var Locale = require('locale/index');
var Polyglot = require('node-polyglot');
require('promise-polyfill');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var deepInsights = require('deep-insights/index');
var ConfigModel = require('builder/data/config-model');
var EditorMapView = require('builder/editor/editor-map-view');
var MapDefinitionModel = require('builder/data/map-definition-model');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('builder/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var WidgetDefinitionsCollection = require('builder/data/widget-definitions-collection');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var createEditorMenuTabPane = require('builder/components/tab-pane/create-editor-menu-tab-pane');
var editorPaneTemplate = require('builder/editor/editor-pane.tpl');
var editorPaneIconItemTemplate = require('builder/editor/editor-pane-icon.tpl');
var ModalsServiceModel = require('builder/components/modals/modals-service-model');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');
var OnboardingsServiceModel = require('builder/components/onboardings/onboardings-service-model');
var BuilderOnboardingLauncher = require('builder/components/onboardings/builder/launcher');
var viewFactory = require('builder/components/view-factory');
var UserModel = require('builder/data/user-model');
var UserNotifications = require('builder/data/user-notifications');
var EditorModel = require('builder/data/editor-model');
var UserActions = require('builder/data/user-actions');
var ImporterManager = require('builder/components/background-importer/background-importer');
var BackgroundPollingModel = require('builder/data/editor-background-polling-model');
var StyleManager = require('builder/editor/style/style-manager');
var DeepInsightsIntegrations = require('./deep-insights-integrations');
var EditFeatureOverlay = require('./deep-insights-integration/edit-feature-overlay');
var Notifier = require('builder/components/notifier/notifier');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
// var WebGLMetrics = require('builder/components/metrics/webgl-metrics');
var FeedbackButtonView = require('builder/editor/feedback/feedback-button-view');
var SettingsOptions = require('builder/data/map-settings');
var SettingsView = require('builder/editor/editor-settings-view');
var OverlaysCollection = require('builder/data/overlays-definition-collection');
var MapcapsCollection = require('builder/data/mapcaps-collection');
var PrivacyCollection = require('builder/components/modals/publish/privacy-collection');
var CreatePrivacyOptions = require('builder/components/modals/publish/create-privacy-options');
var UserGroupFetcher = require('builder/data/users-group-fetcher');
var State = require('builder/data/state-definition-model');
var LegendDefinitionsCollection = require('builder/data/legends/legend-definitions-collection');
var LegendsState = require('builder/data/legends/legends-state');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var EditorVisualizationWarningView = require('builder/components/modals/editor-visualization-warning/editor-visualization-warning-view');
var MapModeModel = require('./map-mode-model');
var BuilderActivatedNotification = require('builder/components/onboardings/builder-activated/builder-activated-notification-view');
var NodeGeometryTracker = require('./node-geometry-tracker');
var WidgetsService = require('builder/editor/widgets/widgets-service');
var DataServicesApiCheck = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');
var AppNotifications = require('./app-notifications');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var Router = require('builder/routes/router');
var handleAnalysesRoute = require('builder/routes/handle-analyses-route');
var handleModalsRoute = require('builder/routes/handle-modals-route');
var handleWidgetRoute = require('builder/routes/handle-widget-route');

// JSON data passed from entry point (editor/visualizations/show.html):
var vizJSON = window.vizJSON;
var stateJSON = window.stateJSON;
var userData = window.userData;
var frontendConfig = window.frontendConfig;
var visualizationData = window.visualizationData;
var layersData = window.layersData;
var analysesData = window.analysesData;
var builderNotifications = window.builderNotifications;
var dashboardNotifications = window.dashboardNotifications;
var mapcapsData = window.mapcapsData;
var overlaysData = window.overlaysData;
var basemaps = window.basemaps;
var mapzenApiKey = window.mapzenApiKey;
var mapboxApiKey = window.mapboxApiKey;

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: userData.base_url,
      api_key: userData.api_key
    },
    frontendConfig
  )
);

DataServicesApiCheck.get(configModel).fetch();

var onboardingNotification = new UserNotifications(builderNotifications, {
  key: 'builder',
  configModel: configModel
});

var userModel = new UserModel(userData, {
  configModel: configModel
});

var editorModel = new EditorModel();

var visDefinitionModel = new VisDefinitionModel(visualizationData, {
  configModel: configModel
});
var modals = new ModalsServiceModel();
var onboardings = new OnboardingsServiceModel();
onboardings.editorModel = editorModel;

UserGroupFetcher.track({
  userModel: userModel,
  configModel: configModel,
  acl: visDefinitionModel.getPermissionModel().acl
});

var stateDefModel = new State({
  json: stateJSON
}, {
  visDefinitionModel: visDefinitionModel
});

var mapId = visualizationData.map_id;

var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
  userModel: userModel,
  configModel: configModel,
  relatedTableData: visualizationData.related_tables
});

var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
  configModel: configModel,
  userModel: userModel,
  analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
  mapId: mapId,
  stateDefinitionModel: stateDefModel
});

var analysisDefinitionsCollection = new AnalysisDefinitionsCollection(analysesData, {
  configModel: configModel,
  analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
  layerDefinitionsCollection: layerDefinitionsCollection,
  vizId: visDefinitionModel.id
});

layerDefinitionsCollection.resetByLayersData(layersData);

// Track geometry changes over any node definition model
NodeGeometryTracker.track({
  analysisDefinitionsCollection: analysisDefinitionsCollection,
  analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
  layerDefinitionsCollection: layerDefinitionsCollection
});

var widgetDefinitionsCollection = new WidgetDefinitionsCollection(null, {
  configModel: configModel,
  mapId: mapId,
  layerDefinitionsCollection: layerDefinitionsCollection,
  analysisDefinitionNodesCollection: analysisDefinitionNodesCollection
});

vizJSON.widgets.forEach(function (widgetDefinitionModel) {
  widgetDefinitionsCollection.add(widgetDefinitionModel);
});

var legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
  configModel: configModel,
  layerDefinitionsCollection: layerDefinitionsCollection,
  vizId: visDefinitionModel.id
});
legendDefinitionsCollection.resetByData(vizJSON);
LegendFactory.init(legendDefinitionsCollection);
LegendsState.init(layerDefinitionsCollection, legendDefinitionsCollection);

Notifier.init({
  editorModel: editorModel,
  visDefinitionModel: visDefinitionModel
});

AppNotifications.init();

MetricsTracker.init({
  userId: userModel.get('id'),
  visId: visDefinitionModel.get('id'),
  configModel: configModel
});

BuilderOnboardingLauncher.init({
  onboardings: onboardings,
  userModel: userModel,
  editorModel: editorModel,
  onboardingNotification: onboardingNotification
});

AnalysesService.init({
  onboardings: onboardings,
  layerDefinitionsCollection: layerDefinitionsCollection,
  modals: modals,
  userModel: userModel,
  configModel: configModel
});

var userActions = UserActions({
  userModel: userModel,
  analysisDefinitionsCollection: analysisDefinitionsCollection,
  analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
  layerDefinitionsCollection: layerDefinitionsCollection,
  widgetDefinitionsCollection: widgetDefinitionsCollection
});

var privacyOptions = CreatePrivacyOptions(visDefinitionModel, userModel);
var privacyCollection = new PrivacyCollection(privacyOptions);

var mapcapsCollection = new MapcapsCollection(mapcapsData, {
  visDefinitionModel: visDefinitionModel
});

var backgroundPollingModel = new BackgroundPollingModel({
  importsPolling: false
}, {
  configModel: configModel,
  userModel: userModel,
  userActions: userActions
});

ImporterManager.init({
  pollingModel: backgroundPollingModel,
  createVis: false,
  userModel: userModel,
  configModel: configModel,
  modals: modals
});

var mapDefModel = new MapDefinitionModel(
  _.extend(
    vizJSON,
    {
      id: visualizationData.map_id
    }
  ),
  {
    parse: true,
    configModel: configModel,
    userModel: userModel,
    layerDefinitionsCollection: layerDefinitionsCollection
  }
);

var overlaysCollection = new OverlaysCollection(overlaysData, {
  configModel: configModel,
  visId: visDefinitionModel.id
});

var mapModeModel = new MapModeModel();

WidgetsService.init({
  analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
  editorModel: editorModel,
  layerDefinitionsCollection: layerDefinitionsCollection,
  modals: modals,
  userActions: userActions,
  widgetDefinitionsCollection: widgetDefinitionsCollection
});

var mapCreation = function () {
  BuilderOnboardingLauncher.launch();

  if (!configModel.get('cartodb_com_hosted')) {
    if (userModel.get('actions').builder_enabled && userModel.get('show_builder_activated_message') &&
        _.isEmpty(dashboardNotifications)) {
      var builderActivatedNotification = new UserNotifications(dashboardNotifications, {
        key: 'dashboard',
        configModel: configModel
      });

      var builderActivatedNotificationView = new BuilderActivatedNotification({
        builderActivatedNotification: builderActivatedNotification
      });

      $('.js-editor').addClass('Editor--topBar');
      builderActivatedNotificationView.bind('clean', function () {
        $('.js-editor').removeClass('Editor--topBar');
      }, this);
    }
  }

  deepInsights.createDashboard('#dashboard', vizJSON, {
    apiKey: configModel.get('api_key'),
    no_cdn: false,
    cartodb_logo: false,
    renderMenu: false,
    show_empty_infowindow_fields: true,
    showLimitErrors: true,
    state: stateJSON,
    interactiveFeatures: true,
    layerSelectorEnabled: false,
    mapzenApiKey: mapzenApiKey,
    mapboxApiKey: mapboxApiKey
  }, function (error, dashboard) {
    if (error) {
      console.error('Dashboard has some errors:\n', error);
    }

    var vis = dashboard.getMap();
    var dashboardView = dashboard.getView();

    dashboardView.listenTo(editorModel, 'change:edition', function (m) {
      dashboardView.$el.toggleClass('is-dark', m.isEditing());
    });

    var styleManager = new StyleManager(layerDefinitionsCollection, vis.map, configModel);

    var editFeatureOverlay = new EditFeatureOverlay({
      map: vis.map,
      mapModeModel: mapModeModel,
      modals: modals
    });
    editFeatureOverlay.hide();
    vis.addCustomOverlay(editFeatureOverlay);

    var deepInsightsIntegrations = new DeepInsightsIntegrations({
      onboardings: onboardings,
      userModel: userModel,
      deepInsightsDashboard: dashboard,
      analysisDefinitionsCollection: analysisDefinitionsCollection,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      layerDefinitionsCollection: layerDefinitionsCollection,
      legendDefinitionsCollection: legendDefinitionsCollection,
      widgetDefinitionsCollection: widgetDefinitionsCollection,
      overlayDefinitionsCollection: overlaysCollection,
      visDefinitionModel: visDefinitionModel,
      mapDefinitionModel: mapDefModel,
      stateDefinitionModel: stateDefModel,
      mapModeModel: mapModeModel,
      configModel: configModel,
      editorModel: editorModel,
      editFeatureOverlay: editFeatureOverlay
    });

    /* if (Math.random() < 0.3) {
      MetricsTracker.track('WebGL stats', WebGLMetrics.getWebGLStats());
    } */

    var currentRoute = Router.getRouteModel().get('currentRoute');
    handleWidgetRoute(currentRoute, widgetDefinitionsCollection);

    // Expose things after Map initialization
    window.deepInsightsIntegrations = deepInsightsIntegrations;
    window.styleManager = styleManager;
    window.dashboard = dashboard;
    window.vis = vis;
  });
};

if (visDefinitionModel.get('version') === 2 && modals) {
  visDefinitionModel.bind('change:version', function () {
    mapcapsCollection.fetch();
    mapCreation();
  }, this);

  modals.create(function (modalModel) {
    return new EditorVisualizationWarningView({
      modalModel: modalModel,
      visDefinitionModel: visDefinitionModel
    });
  }, {
    escapeOptionsDisabled: true,
    keepOpenOnRouteChange: true
  });
} else {
  mapCreation();
}

var settingsCollection = new Backbone.Collection(SettingsOptions(overlaysCollection, mapDefModel, userModel));

Router.init({
  modals: modals,
  widgetDefinitionsCollection: widgetDefinitionsCollection,
  editorModel: editorModel,
  handleModalsRoute: function (currentRoute, modals) {
    handleModalsRoute(currentRoute, modals);
  },
  handleAnalysesRoute: function (currentRoute) {
    handleAnalysesRoute(currentRoute);
  },
  handleWidgetRoute: function (currentRoute, widgetDefinitionsCollection) {
    handleWidgetRoute(currentRoute, widgetDefinitionsCollection);
  }
});

var rootLocation = (/(\/builder\/[0-z\.\-]+\/?)/).exec(location.pathname)[1];
var baseUrl = userModel.isInsideOrg() ? '/u/' + userModel.get('username') : '';
Backbone.history.start({ pushState: true, hashChange: false, root: baseUrl + rootLocation });

var editorTabPaneView = createEditorMenuTabPane([
  {
    icon: 'pencilMenu',
    name: 'editor',
    tooltip: 'edit-map',
    selected: true,
    onClick: function () { Router.goToLayerList(); },
    createContentView: function () {
      editorModel.set({settingsView: false});
      return new EditorMapView({
        basemaps: basemaps,
        userActions: userActions,
        configModel: configModel,
        userModel: userModel,
        editorModel: editorModel,
        pollingModel: backgroundPollingModel,
        mapDefinitionModel: mapDefModel,
        onboardings: onboardings,
        modals: modals,
        visDefinitionModel: visDefinitionModel,
        layerDefinitionsCollection: layerDefinitionsCollection,
        analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
        widgetDefinitionsCollection: widgetDefinitionsCollection,
        mapcapsCollection: mapcapsCollection,
        privacyCollection: privacyCollection,
        legendDefinitionsCollection: legendDefinitionsCollection,
        mapModeModel: mapModeModel,
        stateDefinitionModel: stateDefModel,
        onboardingNotification: onboardingNotification,
        settingsCollection: settingsCollection,
        routeModel: Router.getRouteModel()
      });
    }
  }, {
    icon: 'settings',
    name: 'settings',
    tooltip: 'map-settings',
    onClick: function () { Router.goToSettings(); },
    createContentView: function () {
      editorModel.set({settingsView: true});
      return new SettingsView({
        mapDefinitionModel: mapDefModel,
        overlaysCollection: overlaysCollection,
        mapcapsCollection: mapcapsCollection,
        visDefinitionModel: visDefinitionModel,
        privacyCollection: privacyCollection,
        configModel: configModel,
        userModel: userModel,
        modals: modals,
        editorModel: editorModel,
        settingsCollection: settingsCollection,
        stateDefinitionModel: stateDefModel
      });
    }
  }
], {
  tabPaneOptions: {
    className: 'Editor-wrapper',
    template: editorPaneTemplate,
    url: userModel.get('base_url'),
    avatar_url: userModel.get('avatar_url'),
    tabPaneItemOptions: {
      tagName: 'li',
      klassName: 'EditorMenu-navigationItem'
    },
    onRouteChange: function (routeModel) {
      var route = routeModel.get('currentRoute');
      if (!route) {
        Router.goToDefaultRoute();
        return;
      }
      var routeName = route[0];
      // I feel like we should/could be smarter here
      // This is the top level routing element which should:
      // - Show settings for /settings
      // - Show layers for /layers/**/*
      // because al subsequent views might do something with the route as well
      // but they probably depend on the top level having the correct state
      if (routeName === 'settings') {
        this.setSelectedTabPaneByName('settings');
      } else {
        this.setSelectedTabPaneByName('editor');
      }
    }
  },
  tabPaneItemIconOptions: {
    tagName: 'button',
    template: editorPaneIconItemTemplate,
    className: 'EditorMenu-navigationLink'
  }
});

mapModeModel.bindRouteEvents(Router.getRouteModel());

window.editorTabPane = editorTabPaneView;

$('.js-editor').prepend(editorTabPaneView.render().$el);

editorTabPaneView.listenTo(editorModel, 'change:edition', function (m) {
  editorTabPaneView.$('.Editor-panelWrapper').toggleClass('is-larger', m.isEditing());
});
editorTabPaneView.add_related_model(editorModel);

var tooltip = new TipsyTooltipView({
  el: editorTabPaneView.$('.js-editor-logo'),
  title: function () {
    return _t('back-to-dashboard');
  },
  gravity: 'w'
});
editorTabPaneView.addView(tooltip);

if (!configModel.get('cartodb_com_hosted')) {
  var feedbackView = new FeedbackButtonView({ modals: modals });
  $('.js-editorMenu').append(feedbackView.render().el);
}

document.title = visDefinitionModel.get('name') + ' | CARTO';

if (window.__backboneAgent) {
  window.__backboneAgent.handleBackbone(Backbone);
}

// Expose the root stuff to be able to inspect and modify state from
// developer console (before views)
window.configModel = configModel;
window.modals = modals;
window.onboardings = onboardings;
window.userActions = userActions;
window.userModel = userModel;
window.viewFactory = viewFactory;
window.visDefinitionModel = visDefinitionModel;
window.layerDefinitionsCollection = layerDefinitionsCollection;
window.widgetDefinitionsCollection = widgetDefinitionsCollection;
window.analysisDefinitionsCollection = analysisDefinitionsCollection;
window.analysisDefinitionNodesCollection = analysisDefinitionNodesCollection;
window.legendDefinitionsCollection = legendDefinitionsCollection;
window.editorModel = editorModel;
window.mapDefModel = mapDefModel;
window.overlaysCollection = overlaysCollection;
window.mapcapsCollection = mapcapsCollection;
window.stateDefModel = stateDefModel;
window.settingsCollection = settingsCollection;
window.Router = Router;
