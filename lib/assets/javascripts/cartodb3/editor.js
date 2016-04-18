var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var Ps = require('perfect-scrollbar');
var Polyglot = require('node-polyglot');
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

// JSON data passed from entry point (editor/visualizations/show.html):
var vizJSON = window.vizJSON;
var userData = window.userData;
var frontendConfig = window.frontendConfig;
var visualizationData = window.visualizationData;
var layersData = window.layersData;
var analysesData = window.analysesData;

// Setup root and top-level models and objects
var ACTIVE_LOCALE = window.ACTIVE_LOCALE;
var Locale = require('../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

if (ACTIVE_LOCALE !== 'en') {
  require('moment/locale/' + ACTIVE_LOCALE);
}

window._t = polyglot.t.bind(polyglot);

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

var sqlAPI = new cdb.SQL({
  user: configModel.get('user_name'),
  api_key: configModel.get('api_key'),
  sql_api_template: configModel.get('sql_api_template')
});

var visDefinitionModel = new VisDefinitionModel(visualizationData, {
  configModel: configModel
});
var modals = new ModalsServiceModel();

var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
  sqlAPI: sqlAPI
});

// Setup and create the vis (map, layers etc.) + dashboard (widgets) from the given vizJSON
// Remove old zoom template in order to start using new component
cdb.deepInsights.createDashboard('#dashboard', vizJSON, {
  apiKey: configModel.get('api_key'),
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false
}, function (error, dashboard) {
  if (error) {
    throw error;
  }
  var vis = dashboard.getMap();
  var mapId = visualizationData.map_id;
  var analysisDefinitionsCollection = new AnalysisDefinitionsCollection(analysesData, {
    silent: false, // to force a reset event, for analyses to be done initially
    configModel: configModel,
    analysis: vis.analysis,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    vizId: visDefinitionModel.id
  });

  var layerDefinitionsCollection = new LayerDefinitionsCollection([], {
    configModel: configModel,
    visMap: vis.map,
    analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
    mapId: mapId
  });
  layerDefinitionsCollection.resetByLayersData(layersData);
  var widgetDefinitionsCollection = new WidgetDefinitionsCollection([], {
    configModel: configModel,
    visMap: vis.map,
    dashboard: dashboard,
    mapId: mapId
  });

  vizJSON.widgets.forEach(function (d) {
    widgetDefinitionsCollection.add(d);
  });

  widgetDefinitionsCollection.bind('add remove reset', function () {
    vis.mapView.invalidateSize();
  });

  var editorTabPaneView = createEditorMenuTabPane([
    {
      icon: 'pencil',
      selected: true,
      createContentView: function () {
        return new EditorMapView({
          configModel: configModel,
          userModel: userModel,
          modals: modals,
          visDefinitionModel: visDefinitionModel,
          layerDefinitionsCollection: layerDefinitionsCollection,
          analysisDefinitionsCollection: analysisDefinitionsCollection,
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

  var container = $('.js-content').get(0);

  Ps.initialize(container, {
    wheelSpeed: 2,
    wheelPropagation: true,
    minScrollbarLength: 20
  });

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
});

// WIP, these shortcut snippets can be used to modify the state of the vis being edited
window.snippets = {

  /**
   * Delete all analysis, and update layers
   */
  resetAnalyses: function () {
    _.clone(window.analysisDefinitionsCollection.models).forEach(function (m) {
      m.destroy();
    });
    window.layerDefinitionsCollection.each(function (m) {
      var letter = m.get('letter');
      if (letter) {
        m.save({source: letter + '0'});
      }
    });
  },

  createTableLayer: function (tableName) {
    if (!tableName) throw new Error('a table name must be provied (make sure it exists!)');

    // based on https://github.com/CartoDB/cartodb/blob/132d4589c19cfa47826e20f617a74074b364b049/lib/assets/javascripts/cartodb/models/cartodb_layer.js#L214-L219
    var m = window.layerDefinitionsCollection.first();
    var attrs = JSON.parse(JSON.stringify(m.toJSON())); // deep clone
    delete attrs.id;
    delete attrs.options.source;
    delete attrs.options.letter;
    delete attrs.options.query;
    attrs.options.table_name = tableName;
    attrs.options.tile_style = [
      "#points['mapnik::geometry_type'=1] {",
      '  marker-fill-opacity: 1;',
      '  marker-line-color: #FFF;',
      '  marker-line-width: 0.5;',
      '  marker-line-opacity: 1;',
      '  marker-placement: point;',
      '  marker-type: ellipse;',
      '  marker-width: 8;',
      '  marker-fill: #FABADA;',
      '  marker-allow-overlap: true;',
      '}',
      "#lines['mapnik::geometry_type'=2] {",
      '  line-color: #000000;',
      '  line-width: 2;',
      '  line-opacity: 1;',
      '}',
      "#polygons['mapnik::geometry_type'=3] {",
      '  polygon-fill: #FABADA;',
      '  polygon-opacity: 1;',
      '  line-color: #FFF;',
      '  line-width: 0.5;',
      '  line-opacity: 1;',
      '}'
    ].join('\n');
    attrs.order = _.max(window.layerDefinitionsCollection.pluck('order')) + 1;

    window.layerDefinitionsCollection.create(attrs, {
      wait: true,
      success: function () {
        console.info('layer created, access it through layerDefinitionsCollection.first()');
      }
    });
    window.layerDefinitionsCollection.sort();
  }
};
