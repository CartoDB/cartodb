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
var analysesData = window.analysesData;

// Setup root and top-level models and objects
var ACTIVE_LOCALE = 'en';
var Locale = require('../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);

var configModel = new ConfigModel(
  _.defaults(
    {
      base_url: userData.base_url,
      api_key: userData.api_key
    },
    frontendConfig
  )
);

// Setup and create the vis (map, layers etc.) + dashboard (widgets) from the given vizJSON
// Remove old zoom template in order to start using new component
var dashboard = cdb.deepInsights.createDashboard('#dashboard', vizJSON, {
  apiKey: configModel.get('api_key'),
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false
});
var vis = dashboard.vis;

var mapId = visualizationData.map_id;
var visDefinitionModel = new VisDefinitionModel(visualizationData, {
  configModel: configModel
});
var analysisDefinitionsCollection = new AnalysisDefinitionsCollection(analysesData, {
  configModel: configModel,
  analysis: vis.analysis,
  vizId: visDefinitionModel.id
});
var layerDefinitionsCollection = new LayerDefinitionsCollection([], {
  configModel: configModel,
  visMap: vis.map,
  analysisDefinitionNodesCollection: analysisDefinitionsCollection.analysisDefinitionNodesCollection,
  mapId: mapId
});
layerDefinitionsCollection.resetByLayersData(layersData);
var widgetDefinitionsCollection = new WidgetDefinitionsCollection([], {
  configModel: configModel,
  visMap: vis.map,
  dashboardWidgets: dashboard.widgets,
  mapId: mapId
});

// TODO should we provide a dashboard.done of some sort?
vis.done(function () {
  vizJSON.widgets.forEach(function (d) {
    widgetDefinitionsCollection.add(d);
  });

  widgetDefinitionsCollection.bind('add remove reset', function () {
    vis.mapView.invalidateSize();
  });

  vis.centerMapToOrigin();
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
        analysisDefinitionsCollection: analysisDefinitionsCollection,
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

document.title = vis.map.get('title') + ' | CartoDB';

// Expose the root stuff to be able to inspect and modify state from developer console
window.configModel = configModel;
window.dashboard = dashboard;
window.vis = vis;
window.layerDefinitionsCollection = layerDefinitionsCollection;
window.modals = modals;
window.viewFactory = viewFactory;
window.visDefinitionModel = visDefinitionModel;
window.widgetDefinitionsCollection = widgetDefinitionsCollection;
window.analysisDefinitionsCollection = analysisDefinitionsCollection;
window.analysisDefinitionNodesCollection = analysisDefinitionsCollection.analysisDefinitionNodesCollection;

// WIP, these shortcut snippets can be used to modify the state of the vis being edited
window.snippets = {

  createTableLayer: function (tableName) {
    if (!tableName) throw new Error('a table name must be provied (make sure it exists!)');

    // based on https://github.com/CartoDB/cartodb/blob/132d4589c19cfa47826e20f617a74074b364b049/lib/assets/javascripts/cartodb/models/cartodb_layer.js#L214-L219
    var m = layerDefinitionsCollection.first();
    var attrs = JSON.parse(JSON.stringify(m.toJSON())); // deep clone
    delete attrs.id;
    delete attrs.options.source;
    delete attrs.options.letter;
    attrs.order = _.max(layerDefinitionsCollection.pluck('order')) + 1;

    layerDefinitionsCollection.create(attrs, {
      wait: true,
      success: function () {
        console.info('layer created, access it through layerDefinitionsCollection.first()');
      }
    });
    layerDefinitionsCollection.sort();
  }
};
