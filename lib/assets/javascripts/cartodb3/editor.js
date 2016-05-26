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
var cdb = require('cartodb.js');
var deepInsights = require('cartodb-deep-insights.js');
var ConfigModel = require('./data/config-model');
var EditorMapView = require('./editor/map/map-view');
var AnalysisDefinitionNodesCollection = require('./data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('./data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('./data/layer-definitions-collection');
var WidgetDefinitionsCollection = require('./data/widget-definitions-collection');
var VisDefinitionModel = require('./data/vis-definition-model');
var createEditorMenuTabPane = require('./components/tab-pane/create-editor-menu-tab-pane');
var EditorPaneTemplate = require('./editor-pane.tpl');
var EditorPaneIconItemTemplate = require('./editor-pane-icon.tpl');
var ModalsServiceModel = require('./components/modals/modals-service-model');
var viewFactory = require('./components/view-factory');
var UserModel = require('./data/user-model');
var EditorModel = require('./data/editor-model');
var BackgroundPollingView = require('./components/background-importer/background-polling-view');
var BackgroundPollingModel = require('./data/editor-background-polling-model');
var StyleManager = require('./editor/style/style-manager');
var DeepInsightsIntegrations = require('./deep-insights-integrations');

// JSON data passed from entry point (editor/visualizations/show.html):
var vizJSON = window.vizJSON;
var userData = window.userData;
var frontendConfig = window.frontendConfig;
var visualizationData = window.visualizationData;
var layersData = window.layersData;
var analysesData = window.analysesData;

function InfowindowLink (layerDef, visMap) {
  if (!layerDef.infowindowModel) return;

  function onChange (attrs) {
    visMap.getLayerById(layerDef.id).infowindow.update(attrs.toJSON());
  }

  layerDef.infowindowModel.bind('change', onChange);

  layerDef.bind('destroy', function () {
    layerDef.infowindowModel.unbind('change', onChange);
  });
}

function TooltipLink (layerDef, visMap) {
  if (!layerDef.tooltipModel) return;

  function onChange (attrs) {
    visMap.getLayerById(layerDef.id).tooltip.update(attrs.toJSON());
  }

  layerDef.tooltipModel.bind('change', onChange);

  layerDef.bind('destroy', function () {
    layerDef.tooltipModel.unbind('change', onChange);
  });
}

function InfowindowManager (opts) {
  opts.layerDefinitionsCollection.on('add', function (layerDef) {
    InfowindowLink(layerDef, opts.vis.map);
    TooltipLink(layerDef, opts.vis.map);
  });

  function update () {
    opts.layerDefinitionsCollection.each(function (layerDef) {
      InfowindowLink(layerDef, opts.vis.map);
      TooltipLink(layerDef, opts.vis.map);
    });
  }

  this.initBinds = update.bind(this);

  opts.layerDefinitionsCollection.on('reset', update);
}

cdb.god = new cdb.core.Model(); // To be replaced

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

// Setup and create the vis (map, layers etc.) + dashboard (widgets) from the given vizJSON
// Remove old zoom template in order to start using new component
deepInsights.createDashboard('#dashboard', vizJSON, {
  apiKey: configModel.get('api_key'),
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false,
  show_empty_infowindow_fields: true
}, function (error, dashboard) {
  if (error) {
    throw error;
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
    analysisDefinitionsCollection: analysisDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: mapId
  });

  var vis = dashboard.getMap();
  var dashboardView = dashboard.getView();

  dashboardView.listenTo(editorModel, 'change:edition', function (m) {
    dashboardView.$el.toggleClass('is-dark', m.isEditing());
  });

  dashboardView.add_related_model(editorModel);

  var infowindowManager = new InfowindowManager({
    vis: vis,
    layerDefinitionsCollection: layerDefinitionsCollection
  });

  layerDefinitionsCollection.resetByLayersData(layersData);
  infowindowManager.initBinds();

  var widgetDefinitionsCollection = new WidgetDefinitionsCollection(null, {
    configModel: configModel,
    layerDefinitionsCollection: layerDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: mapId
  });
  window.styleManager = new StyleManager(layerDefinitionsCollection);

  vizJSON.widgets.forEach(function (d) {
    widgetDefinitionsCollection.add(d);
  });

  var deepInsightsIntegrations = new DeepInsightsIntegrations({
    deepInsightsDashboard: dashboard,
    analysisDefinitionsCollection: analysisDefinitionsCollection,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    layerDefinitionsCollection: layerDefinitionsCollection,
    widgetDefinitionsCollection: widgetDefinitionsCollection
  });

  var editorTabPaneView = createEditorMenuTabPane([
    {
      icon: 'pencil',
      selected: true,
      createContentView: function () {
        return new EditorMapView({
          analysis: vis.analysis,
          configModel: configModel,
          userModel: userModel,
          editorModel: editorModel,
          modals: modals,
          visDefinitionModel: visDefinitionModel,
          layerDefinitionsCollection: layerDefinitionsCollection,
          analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
          widgetDefinitionsCollection: widgetDefinitionsCollection
        });
      }
    }, {
      icon: 'settings',
      createContentView: function () {
        return viewFactory.createByHTML('Settings');
      }
    }, {
      icon: 'view',
      createContentView: function () {
        return viewFactory.createByHTML('View');
      }
    }
  ], {
    tabPaneOptions: {
      className: 'Editor-wrapper',
      template: EditorPaneTemplate,
      url: userModel.get('base_url'),
      avatar_url: userModel.get('avatar_url'),
      tabPaneItemOptions: {
        tagName: 'li',
        className: 'EditorMenu-navigationItem'
      }
    },
    tabPaneItemIconOptions: {
      tagName: 'button',
      template: EditorPaneIconItemTemplate,
      className: 'EditorMenu-navigationLink'
    }
  });

  $('.js-editor').prepend(editorTabPaneView.render().$el);

  editorTabPaneView.listenTo(editorModel, 'change:edition', function (m) {
    editorTabPaneView.$('.Editor-panelWrapper').toggleClass('is-larger', m.isEditing());
  });

  editorTabPaneView.add_related_model(editorModel);

  var backgroundPollingModel = new BackgroundPollingModel({
    showGeocodingDatasetURLButton: true,
    geocodingsPolling: true,
    importsPolling: true
  }, {
    configModel: configModel,
    userModel: userModel,
    vis: vis,
    layerDefinitionsCollection: layerDefinitionsCollection
  });

  var backgroundPollingView = new BackgroundPollingView({
    model: backgroundPollingModel,
    createVis: false,
    userModel: userModel,
    configModel: configModel,
    modals: modals
  });

  $('.js-editor').prepend(backgroundPollingView.render().$el);

  vis.centerMapToOrigin();

  document.title = vis.map.get('title') + ' | CartoDB';

  // Expose the root stuff to be able to inspect and modify state from developer console
  window.configModel = configModel;
  window.dashboard = dashboard;
  window.vis = vis;
  window.modals = modals;
  window.viewFactory = viewFactory;
  window.visDefinitionModel = visDefinitionModel;
  window.layerDefinitionsCollection = layerDefinitionsCollection;
  window.widgetDefinitionsCollection = widgetDefinitionsCollection;
  window.analysisDefinitionsCollection = analysisDefinitionsCollection;
  window.analysisDefinitionNodesCollection = analysisDefinitionNodesCollection;
  window.deepInsightsIntegrations = deepInsightsIntegrations;
  window.editorModel = editorModel;
});
