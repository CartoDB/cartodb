var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
if (ACTIVE_LOCALE !== 'en') {
  require('moment/locale/' + ACTIVE_LOCALE);
}
var Locale = require('../../locale/index');
var Polyglot = require('node-polyglot');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});
window._t = polyglot.t.bind(polyglot);

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var deepInsights = require('cartodb-deep-insights.js');
var ConfigModel = require('./data/config-model');
var EditorMapView = require('./editor/editor-map-view');
var MapDefinitionModel = require('./data/map-definition-model');
var AnalysisDefinitionNodesCollection = require('./data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('./data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('./data/layer-definitions-collection');
var WidgetDefinitionsCollection = require('./data/widget-definitions-collection');
var VisDefinitionModel = require('./data/vis-definition-model');
var createEditorMenuTabPane = require('./components/tab-pane/create-editor-menu-tab-pane');
var editorPaneTemplate = require('./editor/editor-pane.tpl');
var editorPaneIconItemTemplate = require('./editor/editor-pane-icon.tpl');
var ModalsServiceModel = require('./components/modals/modals-service-model');
var OnboardingsServiceModel = require('./components/onboardings/onboardings-service-model');
var BuilderOnboardingLauncher = require('./components/onboardings/builder/launcher');
var viewFactory = require('./components/view-factory');
var UserModel = require('./data/user-model');
var UserNotifications = require('./data/user-notifications');
var EditorModel = require('./data/editor-model');
var UserActions = require('./data/user-actions');
var ImporterManager = require('./components/background-importer/background-importer');
var BackgroundPollingModel = require('./data/editor-background-polling-model');
var StyleManager = require('./editor/style/style-manager');
var DeepInsightsIntegrations = require('./deep-insights-integrations');
var EditFeatureOverlay = require('./deep-insights-integration/edit-feature-overlay');
var Notifier = require('./components/notifier/notifier');
var MetricsTracker = require('./components/metrics/metrics-tracker');
var FeedbackButtonView = require('./editor/feedback/feedback-button-view');
var SettingsOptions = require('./data/map-settings');
var SettingsView = require('./editor/editor-settings-view');
var OverlaysCollection = require('./data/overlays-definition-collection');
var MapcapsCollection = require('./data/mapcaps-collection');
var PrivacyCollection = require('./components/modals/publish/privacy-collection');
var CreatePrivacyOptions = require('./components/modals/publish/create-privacy-options');
var UserGroupFetcher = require('./data/users-group-fetcher');
var State = require('./data/state-definition-model');
var LegendDefinitionsCollection = require('./data/legends/legend-definitions-collection');
var LegendFactory = require('./editor/layers/layer-content-views/legend/legend-factory');
var EditorVisualizationWarningView = require('./components/modals/editor-visualization-warning/editor-visualization-warning-view');
var MapModeModel = require('./map-mode-model');
var BuilderActivatedNotification = require('./components/onboardings/builder-activated/builder-activated-notification-view');
var NodeGeometryTracker = require('./node-geometry-tracker');
var TableModel = require('./data/table-model');

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

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: userData.base_url,
      api_key: userData.api_key
    },
    frontendConfig
  )
);

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

BuilderOnboardingLauncher.init({
  onboardings: onboardings,
  userModel: userModel,
  editorModel: editorModel,
  onboardingNotification: onboardingNotification
});

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

var relatedTableModels = _.map(visualizationData.related_tables, function (i) {
  return new TableModel(i, { parse: true, configModel: configModel });
});

var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
  configModel: configModel,
  relatedTableModels: relatedTableModels
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
  mapId: mapId
});

vizJSON.widgets.forEach(function (d) {
  widgetDefinitionsCollection.add(d);
});

var legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
  configModel: configModel,
  layerDefinitionsCollection: layerDefinitionsCollection,
  vizId: visDefinitionModel.id
});
legendDefinitionsCollection.resetByData(vizJSON);
LegendFactory.init(legendDefinitionsCollection);

Notifier.init({
  editorModel: editorModel,
  visDefinitionModel: visDefinitionModel
});

MetricsTracker.init({
  userId: userModel.get('id'),
  visId: visDefinitionModel.get('id'),
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

var mapCreation = function () {
  BuilderOnboardingLauncher.launch();

  if (userModel.get('actions').builder_enabled && _.isEmpty(dashboardNotifications)) {
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

  deepInsights.createDashboard('#dashboard', vizJSON, {
    apiKey: configModel.get('api_key'),
    no_cdn: false,
    cartodb_logo: false,
    renderMenu: false,
    show_empty_infowindow_fields: true,
    state: stateJSON,
    interactiveFeatures: true,
    layerSelectorEnabled: false,
    autoStyle: userModel.featureEnabled('auto-style')
  }, function (error, dashboard) {
    if (error) {
      console.error('Dashboard has some errors:', error);
    }

    var vis = dashboard.getMap();
    var dashboardView = dashboard.getView();

    dashboardView.listenTo(editorModel, 'change:edition', function (m) {
      dashboardView.$el.toggleClass('is-dark', m.isEditing());
    });

    var styleManager = new StyleManager(layerDefinitionsCollection, vis.map);

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
      overlaysCollection: overlaysCollection,
      visDefinitionModel: visDefinitionModel,
      mapDefinitionModel: mapDefModel,
      stateDefinitionModel: stateDefModel,
      mapModeModel: mapModeModel,
      configModel: configModel,
      editorModel: editorModel,
      editFeatureOverlay: editFeatureOverlay
    });

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
  }, true);
} else {
  mapCreation();
}

var editorTabPaneView = createEditorMenuTabPane([
  {
    icon: 'pencil',
    selected: true,
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
        stateDefinitionModel: stateDefModel
      });
    }
  }, {
    icon: 'settings',
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
        settingsCollection: new Backbone.Collection(SettingsOptions(overlaysCollection, mapDefModel, userModel))
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
      className: 'EditorMenu-navigationItem'
    }
  },
  tabPaneItemIconOptions: {
    tagName: 'button',
    template: editorPaneIconItemTemplate,
    className: 'EditorMenu-navigationLink'
  }
});

$('.js-editor').prepend(editorTabPaneView.render().$el);

editorTabPaneView.listenTo(editorModel, 'change:edition', function (m) {
  editorTabPaneView.$('.Editor-panelWrapper').toggleClass('is-larger', m.isEditing());
});
editorTabPaneView.add_related_model(editorModel);

var feedbackView = new FeedbackButtonView({ modals: modals });
$('.js-editorMenu').append(feedbackView.render().el);

document.title = visDefinitionModel.get('name') + ' | CARTO';

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
window.state = stateDefModel;
