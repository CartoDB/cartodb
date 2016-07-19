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
var cdb = require('cartodb.js');
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
var viewFactory = require('./components/view-factory');
var UserModel = require('./data/user-model');
var EditorModel = require('./data/editor-model');
var UserActions = require('./data/user-actions');
var ImporterManager = require('./components/background-importer/background-importer');
var BackgroundPollingModel = require('./data/editor-background-polling-model');
var StyleManager = require('./editor/style/style-manager');
var DeepInsightsIntegrations = require('./deep-insights-integrations');
var Notifier = require('./components/notifier/notifier');
var FeedbackButtonView = require('./editor/feedback/feedback-button-view');
var SettingsOptions = require('./data/map-settings');
var SettingsView = require('./editor/editor-settings-view');
var OverlaysCollection = require('./data/overlays-definition-collection');
var MapcapsCollection = require('./data/mapcaps-collection');
var PrivacyCollection = require('./components/modals/privacy/privacy-collection');
var CreatePrivacyOptions = require('./components/modals/privacy/create-privacy-options');

// JSON data passed from entry point (editor/visualizations/show.html):
var vizJSON = window.vizJSON;
var userData = window.userData;
var frontendConfig = window.frontendConfig;
var visualizationData = window.visualizationData;
var layersData = window.layersData;
var analysesData = window.analysesData;
var basemaps = window.basemaps;

cdb.god = new Backbone.Model(); // To be replaced

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: userData.base_url,
      api_key: userData.api_key
    },
    frontendConfig
  )
);

var userModel = new UserModel(userData, {
  configModel: configModel
});

var editorModel = new EditorModel();

var visDefinitionModel = new VisDefinitionModel(visualizationData, {
  configModel: configModel
});
var modals = new ModalsServiceModel();

// Setup and create the vis (map, layers etc.) + dashboard (widgets)
// from the given vizJSON, but disabling legends
vizJSON = _.extend(
  vizJSON, {
    legends: false
  }
);
deepInsights.createDashboard('#dashboard', vizJSON, {
  apiKey: configModel.get('api_key'),
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false,
  show_empty_infowindow_fields: true
}, function (error, dashboard) {
  if (error) {
    console.log('Dashboard has some errors:', error);
  }

  var mapId = visualizationData.map_id;

  var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
    configModel: configModel
  });

  var analysisDefinitionsCollection = new AnalysisDefinitionsCollection(analysesData, {
    configModel: configModel,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    vizId: visDefinitionModel.id
  });

  var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
    configModel: configModel,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: mapId
  });

  var vis = dashboard.getMap();
  var dashboardView = dashboard.getView();

  dashboardView.listenTo(editorModel, 'change:edition', function (m) {
    dashboardView.$el.toggleClass('is-dark', m.isEditing());
  });

  dashboardView.add_related_model(editorModel);

  layerDefinitionsCollection.resetByLayersData(layersData);

  var widgetDefinitionsCollection = new WidgetDefinitionsCollection(null, {
    configModel: configModel,
    mapId: mapId
  });
  var styleManager = new StyleManager(layerDefinitionsCollection, vis.map);

  vizJSON.widgets.forEach(function (d) {
    widgetDefinitionsCollection.add(d);
  });

  var deepInsightsIntegrations = new DeepInsightsIntegrations({
    deepInsightsDashboard: dashboard,
    analysisDefinitionsCollection: analysisDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    layerDefinitionsCollection: layerDefinitionsCollection,
    widgetDefinitionsCollection: widgetDefinitionsCollection,
    visDefinitionModel: visDefinitionModel
  });

  Notifier.init({
    editorModel: editorModel,
    visDefinitionModel: visDefinitionModel
  });

  var userActions = UserActions({
    userModel: userModel,
    analysisDefinitionsCollection: analysisDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    layerDefinitionsCollection: layerDefinitionsCollection,
    widgetDefinitionsCollection: widgetDefinitionsCollection
  });

  var backgroundPollingModel = new BackgroundPollingModel({
    showGeocodingDatasetURLButton: false,
    geocodingsPolling: false,
    importsPolling: false
  }, {
    configModel: configModel,
    userModel: userModel,
    vis: vis,
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
      vis: vis,
      userModel: userModel,
      layerDefinitionsCollection: layerDefinitionsCollection
    }
  );

  var mapcapsCollection = new MapcapsCollection([], {
    visDefinitionModel: visDefinitionModel
  });

  mapcapsCollection.fetch({reset: true});

  var privacyOptions = CreatePrivacyOptions(visDefinitionModel, userModel);
  var privacyCollection = new PrivacyCollection(privacyOptions);

  var overlaysCollection = new OverlaysCollection([], {
    syncCollection: vis.overlaysCollection,
    configModel: configModel,
    visId: visDefinitionModel.id
  });

  overlaysCollection.fetch({reset: true});

  // Expose the root stuff to be able to inspect and modify state from developer console (before views)
  window.configModel = configModel;
  window.dashboard = dashboard;
  window.vis = vis;
  window.modals = modals;
  window.userActions = userActions;
  window.userModel = userModel;
  window.viewFactory = viewFactory;
  window.visDefinitionModel = visDefinitionModel;
  window.layerDefinitionsCollection = layerDefinitionsCollection;
  window.widgetDefinitionsCollection = widgetDefinitionsCollection;
  window.analysisDefinitionsCollection = analysisDefinitionsCollection;
  window.analysisDefinitionNodesCollection = analysisDefinitionNodesCollection;
  window.deepInsightsIntegrations = deepInsightsIntegrations;
  window.editorModel = editorModel;
  window.styleManager = styleManager;
  window.mapDefModel = mapDefModel;
  window.overlaysCollection = overlaysCollection;

  var editorTabPaneView = createEditorMenuTabPane([
    {
      icon: 'pencil',
      selected: true,
      createContentView: function () {
        return new EditorMapView({
          basemaps: basemaps,
          userActions: userActions,
          analysis: vis.analysis,
          configModel: configModel,
          userModel: userModel,
          editorModel: editorModel,
          pollingModel: backgroundPollingModel,
          modals: modals,
          visDefinitionModel: visDefinitionModel,
          layerDefinitionsCollection: layerDefinitionsCollection,
          analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
          widgetDefinitionsCollection: widgetDefinitionsCollection,
          mapcapsCollection: mapcapsCollection,
          privacyCollection: privacyCollection
        });
      }
    }, {
      icon: 'settings',
      createContentView: function () {
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
          settingsCollection: new Backbone.Collection(SettingsOptions(vis.overlaysCollection, mapDefModel, userModel))
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

  vis.centerMapToOrigin();

  document.title = vis.map.get('title') + ' | CARTO';
});

if (window.__backboneAgent) {
  window.__backboneAgent.handleBackbone(Backbone);
}
