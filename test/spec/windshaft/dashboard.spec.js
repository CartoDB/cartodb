var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Dashboard = require('cdb/windshaft/dashboard');
var DashboardInstance = require('cdb/windshaft/dashboard-instance');
var Map = require('cdb/geo/map');
var CartoDBLayer = require('cdb/geo/map/cartodb-layer');
var TorqueLayer = require('cdb/geo/map/torque-layer');
var HistogramModel = require('cdb/geo/ui/widgets/histogram/model');
var Model = require('cdb/geo/ui/widgets/histogram/model');
var CategoryFilter = require('cdb/windshaft/filters/category');
var WidgetModelFactory = require('cdb/geo/ui/widgets/widget-model-factory');

fdescribe('src/windshaft/dashboard', function() {
  beforeEach(function() {
    $.ajax = function() {};
  });

  it('should create an instance of the dashboard and update the URLs of layers and widgets', function() {
    var dashboardInstance = new DashboardInstance({
      metadata: {
        layers: [
          {
            "type": "mapnik",
            "meta": {},
            "widgets": {
              "widgetId": {
                "url": {
                  "http": "http://example.com",
                  "https": "https://example.com"
                }
              }
            }
          }
        ]
      }
    });

    spyOn(dashboardInstance, 'getBaseURL').and.returnValue('baseURL');
    spyOn(dashboardInstance, 'getTiles').and.callFake(function(type) {
      if (type === 'torque') {
        return 'torqueTileURLs';
      }
      return 'tileURLs';
    });
    var client = {
      instantiateMap: function(options) {
        options.success(dashboardInstance);
      }
    };
    var configGenerator = {
      generate: function() {}
    };
    var cartoDBLayerGroup = new Backbone.Model();
    var cartoDBLayer1 = new CartoDBLayer();

    var filter = new CategoryFilter({layerIndex: 0 });
    var widgetModelFactory = new WidgetModelFactory({
      list: function(attrs) {
        return new HistogramModel(attrs, {
          filter: filter
        });
      },
    });
    var widgetAttrs = {
      id: 'widgetId',
      type: 'list'
    }
    var widget = widgetModelFactory.createModel(widgetAttrs, 0);
    cartoDBLayer1.addWidget(widget);

    var cartoDBLayer2 = new CartoDBLayer();
    var torqueLayer = new TorqueLayer();
    var interactiveLayers = [
      cartoDBLayer1,
      cartoDBLayer2,
      torqueLayer
    ];
    var map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

    var dashboard = new Dashboard({
      client: client,
      configGenerator: configGenerator,
      statTag: 'stat_tag',
      layerGroup: cartoDBLayerGroup,
      layers: interactiveLayers,
      map: map
    });

    // urls of the layerGroup have been updated
    expect(cartoDBLayerGroup.get('baseURL')).toEqual('baseURL');
    expect(cartoDBLayerGroup.get('urls')).toEqual('tileURLs');

    // urls of torque layers have been updated too!
    expect(torqueLayer.get('urls')).toEqual('torqueTileURLs');

    // url of widget have been updated
    expect(widget.get('url')).toEqual('http://example.com');
  });

  it('should pass the filters of visible layers to create the instance', function() {
    var client = {
      instantiateMap: function() {}
    };
    spyOn(client, 'instantiateMap');

    var configGenerator = {
      generate: function() {}
    };
    var cartoDBLayerGroup = new Backbone.Model();
    var cartoDBLayer1 = new CartoDBLayer();

    var filter = new CategoryFilter({layerIndex: 0 });
    spyOn(filter, 'isEmpty').and.returnValue(false);
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' });

    var widgetModelFactory = new WidgetModelFactory({
      list: function(attrs) {
        return new HistogramModel(attrs, {
          filter: filter
        });
      },
    });

    var widgetAttrs = {
      id: 'widgetId',
      type: 'list'
    }
    var widget = widgetModelFactory.createModel(widgetAttrs, 0);
    cartoDBLayer1.addWidget(widget);

    var cartoDBLayer2 = new CartoDBLayer();
    var interactiveLayers = [
      cartoDBLayer1,
      cartoDBLayer2,
    ];
    var map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

    var dashboard = new Dashboard({
      client: client,
      configGenerator: configGenerator,
      statTag: 'stat_tag',
      layerGroup: cartoDBLayerGroup,
      layers: interactiveLayers,
      map: map
    });

    expect(client.instantiateMap.calls.mostRecent().args[0].filters).toEqual({
      layers: [{
        something: 'else'
      }]
    });

    // Hide the layer
    cartoDBLayer1.set('visible', false);

    // client.instantiateMap has been called again, but this time no filters are passed
    expect(client.instantiateMap.calls.mostRecent().args[0].filters).toEqual({});
  });

  it('should update the urls of widgets when bounding box changes', function() {
    jasmine.clock().install();

    var dashboardInstance = new DashboardInstance({
      layergroupid: 'dashboardId',
      metadata: {
        layers: [
          {
            "type": "mapnik",
            "meta": {},
            "widgets": {
              "widgetId": {
                "url": {
                  "http": "http://example.com",
                  "https": "https://example.com"
                }
              }
            }
          }
        ]
      }
    });

    spyOn(dashboardInstance, 'getBaseURL').and.returnValue('baseURL');
    spyOn(dashboardInstance, 'getTiles').and.callFake(function(type) {
      if (type === 'torque') {
        return 'torqueTileURLs';
      }
      return 'tileURLs';
    });

    var client = {
      instantiateMap: function(args) {
        args.success(dashboardInstance);
      }
    };

    var configGenerator = {
      generate: function() {}
    };
    var cartoDBLayerGroup = new Backbone.Model();
    var cartoDBLayer1 = new CartoDBLayer();

    var filter = new CategoryFilter({layerIndex: 0 });
    spyOn(filter, 'isEmpty').and.returnValue(false);
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' });

    var widgetModelFactory = new WidgetModelFactory({
      list: function(attrs) {
        return new HistogramModel(attrs, {
          filter: filter
        });
      },
    });

    var widgetAttrs = {
      id: 'widgetId',
      type: 'list'
    }
    var widget = widgetModelFactory.createModel(widgetAttrs, 0);
    cartoDBLayer1.addWidget(widget);

    var interactiveLayers = [
      cartoDBLayer1
    ];
    var map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

    var dashboard = new Dashboard({
      client: client,
      configGenerator: configGenerator,
      statTag: 'stat_tag',
      layerGroup: cartoDBLayerGroup,
      layers: interactiveLayers,
      map: map
    });

    // url of widget have been updated
    expect(widget.url()).toEqual('http://example.com');

    map.setBounds([['s', 'w'], ['n', 'e']]);
    map.trigger('change:center');

    // Wait a bit
    jasmine.clock().tick(1000);

    // widget url has been update and now includes the bounding box filter
    expect(widget.url()).toEqual('http://example.com?bbox=');

    jasmine.clock().uninstall();
  });

  it('should create a new instance when some attributes of a layer changes', function() {
    var client = {
      instantiateMap: function() {}
    };
    spyOn(client, 'instantiateMap');

    var configGenerator = {
      generate: function() {}
    };
    var cartoDBLayerGroup = new Backbone.Model();
    var cartoDBLayer1 = new CartoDBLayer();

    var filter = new CategoryFilter({layerIndex: 0 });
    spyOn(filter, 'isEmpty').and.returnValue(false);
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' });

    var widgetModelFactory = new WidgetModelFactory({
      list: function(attrs) {
        return new HistogramModel(attrs, {
          filter: filter
        });
      },
    });

    var widgetAttrs = {
      id: 'widgetId',
      type: 'list'
    }
    var widget = widgetModelFactory.createModel(widgetAttrs, 0);
    cartoDBLayer1.addWidget(widget);

    var cartoDBLayer2 = new CartoDBLayer();
    var interactiveLayers = [
      cartoDBLayer1,
      cartoDBLayer2,
    ];
    var map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

    var dashboard = new Dashboard({
      client: client,
      configGenerator: configGenerator,
      statTag: 'stat_tag',
      layerGroup: cartoDBLayerGroup,
      layers: interactiveLayers,
      map: map
    });

    expect(client.instantiateMap.calls.count()).toEqual(1);

    // Hide the layer
    cartoDBLayer1.set('visible', false);

    expect(client.instantiateMap.calls.count()).toEqual(2);
  });

  it('should create a new instance when the filter of a layer changes', function() {
    var client = {
      instantiateMap: function() {}
    };
    spyOn(client, 'instantiateMap');

    var configGenerator = {
      generate: function() {}
    };
    var cartoDBLayerGroup = new Backbone.Model();
    var cartoDBLayer1 = new CartoDBLayer();

    var filter = new CategoryFilter({layerIndex: 0 });
    spyOn(filter, 'isEmpty').and.returnValue(false);
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' });

    var widgetModelFactory = new WidgetModelFactory({
      list: function(attrs) {
        return new HistogramModel(attrs, {
          filter: filter
        });
      },
    });

    var widgetAttrs = {
      id: 'widgetId',
      type: 'list'
    }
    var widget = widgetModelFactory.createModel(widgetAttrs, 0);
    cartoDBLayer1.addWidget(widget);

    var cartoDBLayer2 = new CartoDBLayer();
    var interactiveLayers = [
      cartoDBLayer1,
      cartoDBLayer2,
    ];
    var map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

    var dashboard = new Dashboard({
      client: client,
      configGenerator: configGenerator,
      statTag: 'stat_tag',
      layerGroup: cartoDBLayerGroup,
      layers: interactiveLayers,
      map: map
    });

    expect(client.instantiateMap.calls.count()).toEqual(1);

    // Filter has changed
    cartoDBLayer1.trigger('change:filter', cartoDBLayer1);

    expect(client.instantiateMap.calls.count()).toEqual(2);
  });

  fit('should refresh the URLs of widgets and only trigger a change event if the widget belongs to the layer that changed', function() {
    var dashboardInstance = new DashboardInstance({
      metadata: {
        layers: [
          {
            "type": "mapnik",
            "meta": {},
            "widgets": {
              "widgetId1": {
                "url": {
                  "http": "http://example.com",
                  "https": "https://example.com"
                }
              }
            }
          },
          {
            "type": "mapnik",
            "meta": {},
            "widgets": {
              "widgetId2": {
                "url": {
                  "http": "http://example.com",
                  "https": "https://example.com"
                }
              }
            }
          }
        ]
      }
    });
    spyOn(dashboardInstance, 'getBaseURL').and.returnValue('baseURL');
    spyOn(dashboardInstance, 'getTiles').and.callFake(function(type) {
      if (type === 'torque') {
        return 'torqueTileURLs';
      }
      return 'tileURLs';
    });

    var client = {
      instantiateMap: function(args) {
        args.success(dashboardInstance);
      }
    };

    var configGenerator = {
      generate: function() {}
    };
    var cartoDBLayerGroup = new Backbone.Model();
    var cartoDBLayer1 = new CartoDBLayer();

    var filter = new CategoryFilter({layerIndex: 0 });
    spyOn(filter, 'isEmpty').and.returnValue(false);
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' });

    var widgetModelFactory = new WidgetModelFactory({
      list: function(attrs) {
        return new HistogramModel(attrs, {
          filter: filter
        });
      },
    });

    var widgetAttrs = {
      id: 'widgetId1',
      type: 'list'
    }
    var widget1 = widgetModelFactory.createModel(widgetAttrs, 0);
    cartoDBLayer1.addWidget(widget1);

    var widgetAttrs = {
      id: 'widgetId2',
      type: 'list'
    }
    var widget2 = widgetModelFactory.createModel(widgetAttrs, 0);
    var cartoDBLayer2 = new CartoDBLayer();
    cartoDBLayer2.addWidget(widget2);

    var interactiveLayers = [
      cartoDBLayer1,
      cartoDBLayer2,
    ];
    var map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

    var dashboard = new Dashboard({
      client: client,
      configGenerator: configGenerator,
      statTag: 'stat_tag',
      layerGroup: cartoDBLayerGroup,
      layers: interactiveLayers,
      map: map
    });

    // Bind some callbacks to check which change:url events do widgets trigger
    var callback1 = jasmine.createSpy('callback1');
    var callback2 = jasmine.createSpy('callback2');

    widget1.bind('change:url', callback1);
    widget2.bind('change:url', callback2);

    // Filter has changed by cartoDBLayer1
    cartoDBLayer1.trigger('change:filter', cartoDBLayer1);

    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});
