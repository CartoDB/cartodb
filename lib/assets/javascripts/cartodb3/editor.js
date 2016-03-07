var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var Polyglot = require('node-polyglot');
var ConfigModel = require('./data/config-model');
var EditorMapView = require('./editor/map/map-view');
var AnalysisDefinitionsCollection = require('./data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('./data/layer-definitions-collection');
var WidgetDefinitionsCollection = require('./data/widget-definitions-collection');
var VisDefinitionModel = require('./data/vis-definition-model');
var createEditorMenuTabPane = require('./components/tab-pane/create-editor-menu-tab-pane');
var EditorPaneTemplate = require('./editor-pane.tpl');
var EditorPaneIconItemTemplate = require('./editor-pane-icon.tpl');
var ModalsServiceModel = require('./components/modals/modals-service-model');
var viewFactory = require('./components/view-factory');

// JSON data passed from entry point (editor/visualizations/show.html):
var vizJSON = window.vizJSON;
var userData = window.userData;
var frontendConfig = window.frontendConfig;
var visualizationData = window.visualizationData;
var layersData = window.layersData;

// Setup root and top-level models and objects
var ACTIVE_LOCALE = 'en';
var Locale = require('../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);

// Setup and create the vis (map, layers etc.) + dashboard (widgets) from the given vizJSON
// Remove old zoom template in order to start using new component
// TODO: decide how to manage this problem
delete vizJSON.overlays[2].template; // Zoom template
var dashboard = cdb.deepInsights.createDashboard('#dashboard', vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false
});

var mapId = visualizationData.map_id;
var layersCollection = dashboard.vis.map.layers;
var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: userData.base_url,
      api_key: userData.api_key
    },
    frontendConfig
  )
);

var analysisDefinitionsCollection = new AnalysisDefinitionsCollection([], {
  configModel: configModel
});
var visDefinitionModel = new VisDefinitionModel(visualizationData, {
  configModel: configModel
});
var layerDefinitionsCollection = new LayerDefinitionsCollection(layersData, {
  configModel: configModel,
  layersCollection: layersCollection,
  analysisDefinitionsCollection: analysisDefinitionsCollection,
  mapId: mapId
});
var widgetDefinitionsCollection = new WidgetDefinitionsCollection([], {
  configModel: configModel,
  layersCollection: layersCollection,
  dashboardWidgets: dashboard.widgets,
  mapId: mapId
});

// TODO should we provide a dashboard.done of some sort?
dashboard.vis.done(function () {
  vizJSON.widgets.forEach(function (d) {
    widgetDefinitionsCollection.add(d);
  });

  widgetDefinitionsCollection.bind('add remove reset', function () {
    dashboard.vis.mapView.invalidateSize();
  });

  dashboard.vis.centerMapToOrigin();
})
.error(function (err) {
  console.error(err);
});

var modals = new ModalsServiceModel();
var editorTabPaneView = createEditorMenuTabPane([
  {
    icon: 'edition',
    selected: true,
    createContentView: function () {
      return new EditorMapView({
        modals: modals,
        visDefinitionModel: visDefinitionModel,
        layerDefinitionsCollection: layerDefinitionsCollection,
        widgetDefinitionsCollection: widgetDefinitionsCollection
      });
    }
  }, {
    icon: 'view',
    createContentView: function () {
      return viewFactory.createByHTML('View');
    }
  }, {
    icon: 'odyssey',
    createContentView: function () {
      return viewFactory.createByHTML('Odyssey');
    }
  }, {
    icon: 'settings',
    createContentView: function () {
      return viewFactory.createByHTML('Settings');
    }
  }], {
    tabPaneOptions: {
      className: 'Editor-wrapper',
      template: EditorPaneTemplate,
      url: userData.base_url,
      avatar_url: userData.avatar_url,
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

document.title = dashboard.vis.map.get('title') + ' | CartoDB';

// Expose the root stuff to be able to inspect and modify state from developer console
window.configModel = configModel;
window.dashboard = dashboard;
window.layerDefinitionsCollection = layerDefinitionsCollection;
window.modals = modals;
window.viewFactory = viewFactory;
window.vis = dashboard.vis;
window.visDefinitionModel = visDefinitionModel;
window.widgetDefinitionsCollection = widgetDefinitionsCollection;
window.analysisDefinitionsCollection = analysisDefinitionsCollection;
