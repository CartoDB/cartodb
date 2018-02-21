var Backbone = require('backbone');
var $ = require('jquery');
var deepInsights = require('../../../../javascripts/deep-insights/index');

var ConfigModel = require('../../../../javascripts/builder/data/config-model');
var UserModel = require('../../../../javascripts/builder/data/user-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/builder/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../javascripts/builder/data/analysis-definitions-collection');
var DeepInsightsHelpers = require('../../../../javascripts/builder/deep-insights-integration/deep-insights-helpers');
var LayerDefinitionsCollection = require('../../../../javascripts/builder/data/layer-definitions-collection');
var VisDefinitionModel = require('../../../../javascripts/builder/data/vis-definition-model');
var MapDefinitionModel = require('../../../../javascripts/builder/data/map-definition-model');
var LegendDefinitionsCollection = require('../../../../javascripts/builder/data/legends/legend-definitions-collection');
var MapModeModel = require('../../../../javascripts/builder/map-mode-model');
var StateDefinitionModel = require('../../../../javascripts/builder/data/state-definition-model');
var WidgetDefinitionsCollection = require('../../../../javascripts/builder/data/widget-definitions-collection');

module.exports = {
  createOnboardings: function () {
    return {
      create: function () {
        return {};
      }
    };
  },

  createVIZJSON: function () {
    return {
      bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]],
      center: '[41.40578459184651, 2.2230148315429688]',
      user: {},
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      analyses: [{
        id: 'a0',
        type: 'source',
        options: {
          table_name: 'world_borders',
          simple_geom: 'polygon'
        }
      }],
      layers: this.createLayersData(),
      options: {
        scrollwheel: false
      },
      legends: true,
      widgets: []
    };
  },

  createErrorLayerData: function () {
    return {
      id: 'l-1',
      type: 'CartoDB',
      options: {
        source: 'a0',
        cartocss: 'hello'
      },
      error: {
        type: 'layer',
        subtype: 'turbo-carto',
        context: {
          source: {
            start: {
              line: 99
            }
          }
        },
        message: 'something went wrong'
      }
    };
  },

  createLayerData: function () {
    return {
      id: 'l-1',
      kind: 'carto',
      type: 'CartoDB',
      options: {
        source: 'a0',
        cartocss: 'hello',
        sql: 'SELECT * FROM world_borders',
        table_name: 'world_borders'
      },
      infowindow: {
        alternative_names: {},
        autoPan: true,
        content: '',
        fields: [],
        headerColor: {},
        latlng: [0, 0],
        maxHeight: 180,
        offset: [28, 0],
        template: '',
        template_name: 'table/views/infowindow_light',
        visibility: false,
        width: 226
      },
      legends: [
        {
          type: 'bubble',
          title: 'My Bubble Legend',
          definition: {
            color: '#FABADA'
          }
        },
        {
          type: 'choropleth',
          title: 'My Choropleth Legend',
          prefix: 'prefix',
          sufix: 'sufix'
        }
      ]
    };
  },

  createLayersData: function () {
    return [
      this.createLayerData()
    ];
  },

  createFakeLayer: function (attrs) {
    var layer = new Backbone.Model(attrs);
    layer.isVisible = function () {
      return true;
    };
    return layer;
  },

  createFakeDOMElement: function () {
    var el = document.createElement('div');
    el.id = 'wdmtmp';
    document.body.appendChild(el);
    return el;
  },

  createFakeDashboard: function (mapElement, callback) {
    deepInsights.createDashboard(
      '#' + mapElement.id,
      this.createVIZJSON(),
      {},
      function (er, dashboard) {
        // Avoid HTTP requests setting img src to nothing
        $(mapElement).find('img').removeAttr('src');

        callback(dashboard);
      }
    );
  },

  createFakeObjects: function (deepInsightsDashboard) {
    var configModel = new ConfigModel({
      base_url: 'pepito'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    var diDashboardHelpers = new DeepInsightsHelpers(deepInsightsDashboard);

    var editorModel = new Backbone.Model({
      settings: false
    });

    var visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: configModel
    });

    var stateDefinitionModel = new StateDefinitionModel({
      json: {
        map: {
          zoom: 10
        }
      }
    }, { visDefinitionModel: visDefinitionModel });

    var a0 = {
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * FROM foobar'
      }
    };

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection([a0], {
      configModel: configModel,
      userModel: userModel
    });

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: stateDefinitionModel
    });
    layerDefinitionsCollection.resetByLayersData(this.createLayersData());

    var analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      vizId: 'v-123',
      layerDefinitionsCollection: layerDefinitionsCollection
    });

    var mapDefinitionModel = new MapDefinitionModel({
      scrollwheel: false
    }, {
      parse: true,
      configModel: configModel,
      userModel: userModel,
      layerDefinitionsCollection: layerDefinitionsCollection
    });

    var widgetDefinitionsCollection = new WidgetDefinitionsCollection(null, {
      configModel: configModel,
      mapId: 'map-123',
      layerDefinitionsCollection: layerDefinitionsCollection,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection
    });

    var legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
      configModel: configModel,
      layerDefinitionsCollection: layerDefinitionsCollection,
      vizId: 'v-123'
    });

    legendDefinitionsCollection.resetByData(this.createVIZJSON());

    return {
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      analysisDefinitionsCollection: analysisDefinitionsCollection,
      configModel: configModel,
      diDashboardHelpers: diDashboardHelpers,
      editFeatureOverlay: new Backbone.View(),
      editorModel: editorModel,
      layerDefinitionsCollection: layerDefinitionsCollection,
      legendDefinitionsCollection: legendDefinitionsCollection,
      mapDefinitionModel: mapDefinitionModel,
      mapModeModel: new MapModeModel(),
      onboardings: this.createOnboardings(),
      overlayDefinitionsCollection: new Backbone.Collection(),
      stateDefinitionModel: stateDefinitionModel,
      userModel: userModel,
      visDefinitionModel: visDefinitionModel,
      widgetDefinitionsCollection: widgetDefinitionsCollection
    };
  }
};
