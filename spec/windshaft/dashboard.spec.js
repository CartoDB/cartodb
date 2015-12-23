var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var HistogramDataviewModel = require('../../src/dataviews/histogram-dataview-model');
var Dashboard = require('../../src/windshaft/dashboard');
var DashboardInstance = require('../../src/windshaft/dashboard-instance');
var CategoryFilter = require('../../src/windshaft/filters/category');

describe('windshaft/dashboard', function () {
  beforeEach(function () {
    // Disable ajax
    this.ajax = $.ajax;
    $.ajax = function () {};

    // Disable debounce for these tests
    this.debounce = _.debounce;
    _.debounce = function (func) { return function () { func.apply(this, arguments); }; };

    this.dashboardInstance = new DashboardInstance({
      metadata: {
        layers: [
          {
            'type': 'mapnik',
            'meta': {},
            'widgets': {
              'dataviewId': {
                'url': {
                  'http': 'http://example.com',
                  'https': 'https://example.com'
                }
              }
            }
          }
        ]
      }
    });
    this.dataviews = new Backbone.Collection();

    spyOn(this.dashboardInstance, 'getBaseURL').and.returnValue('baseURL');
    spyOn(this.dashboardInstance, 'getTiles').and.callFake(function (type) {
      if (type === 'torque') {
        return 'torqueTileURLs';
      }
      return 'tileURLs';
    });

    this.client = {
      instantiateMap: function (options) {
        options.success(this.dashboardInstance);
      }.bind(this)
    };

    this.configGenerator = {
      generate: function () {}
    };

    this.map = new cdb.geo.Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

    this.cartoDBLayerGroup = new Backbone.Model();
    this.cartoDBLayer1 = new cdb.geo.CartoDBLayer({ id: '12345-67890' });
    this.cartoDBLayer2 = new cdb.geo.CartoDBLayer({ id: '09876-54321' });
    this.torqueLayer = new cdb.geo.TorqueLayer();
  });

  afterEach(function () {
    $.ajax = this.ajax;

    _.debounce = this.debounce;
  });

  it('should create an instance of the dashboard and update the URLs of layers and dataviews', function () {
    var dataview = new HistogramDataviewModel({
      id: 'dataviewId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    });
    this.dataviews.add(dataview);

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ],
      dataviews: this.dataviews,
      map: this.map
    });

    // urls of the layerGroup have been updated
    expect(this.cartoDBLayerGroup.get('baseURL')).toEqual('baseURL');
    expect(this.cartoDBLayerGroup.get('urls')).toEqual('tileURLs');

    // urls of torque layers have been updated too!
    expect(this.torqueLayer.get('urls')).toEqual('torqueTileURLs');

    // url of dataview have been updated
    expect(dataview.url()).toEqual('http://example.com');
  });

  it('should pass the filters of visible layers to create the instance', function () {
    spyOn(this.client, 'instantiateMap');

    var filter = new CategoryFilter({ layerIndex: 0 });
    spyOn(filter, 'isEmpty').and.returnValue(false);
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' });

    var dataview = new HistogramDataviewModel({
      id: 'dataviewId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1,
      filter: filter
    });

    this.dataviews.add(dataview);

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      dataviews: this.dataviews,
      map: this.map
    });

    expect(this.client.instantiateMap.calls.mostRecent().args[0].filters).toEqual({
      layers: [{
        something: 'else'
      }]
    });

    // Hide the layer
    this.cartoDBLayer1.set('visible', false);

    // client.instantiateMap has been called again, but this time no filters are passed
    expect(this.client.instantiateMap.calls.mostRecent().args[0].filters).toEqual({});
  });

  it('should update the urls of dataviews when bounding box changes', function () {
    this.client.instantiateMap = function (args) {
      this.dashboardInstance.set({
        layergroupid: 'dashboardId',
        metadata: {
          layers: [
            {
              'type': 'mapnik',
              'meta': {},
              'widgets': {
                'dataviewId': {
                  'url': {
                    'http': 'http://example.com/dataviewId',
                    'https': 'https://example.comdataviewId'
                  }
                }
              }
            }
          ]
        }
      });
      args.success(this.dashboardInstance);
    }.bind(this);

    var dataview = new HistogramDataviewModel({
      id: 'dataviewId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    });
    this.dataviews.add(dataview);

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1 ],
      dataviews: this.dataviews,
      map: this.map
    });

    // url of dataview have been updated
    expect(dataview.url()).toEqual('http://example.com/dataviewId');

    // This dataviews needs this attribute to be true in order to submit the bbox filter
    dataview.set('submitBBox', true);

    // Map bounds changes and event is triggered
    this.map.setBounds([['s', 'w'], ['n', 'e']]);
    this.map.trigger('change:center');

    // dataview url has been updated and now includes the bounding box filter
    expect(dataview.url()).toEqual('http://example.com/dataviewId?bbox=w,s,e,n');
  });

  it('should create a new instance when some attributes of a layer changes', function () {
    spyOn(this.client, 'instantiateMap');

    var dataview = new HistogramDataviewModel({
      id: 'dataviewId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    });
    this.dataviews.add(dataview);

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      dataviews: this.dataviews,
      map: this.map
    });

    expect(this.client.instantiateMap.calls.count()).toEqual(1);

    // Hide the layer
    this.cartoDBLayer1.set('visible', false);

    expect(this.client.instantiateMap.calls.count()).toEqual(2);
  });

  it('should create a new instance when the filter of a layer changes', function () {
    spyOn(this.client, 'instantiateMap');

    var filter = new CategoryFilter({ layerIndex: 0 });
    spyOn(filter, 'isEmpty').and.returnValue(false);
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' });

    var dataview = new HistogramDataviewModel({
      id: 'dataviewId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1,
      filter: filter
    });
    this.dataviews.add(dataview);

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      dataviews: this.dataviews,
      map: this.map
    });

    expect(this.client.instantiateMap.calls.count()).toEqual(1);

    // Filter has changed
    dataview.trigger('change:filter', dataview);

    expect(this.client.instantiateMap.calls.count()).toEqual(2);
  });

  it('should refresh the URLs of dataviews and only trigger a change event if the dataview belongs to the layer that changed', function () {
    var i = 0;
    this.client.instantiateMap = function (args) {
      this.dashboardInstance.set('metadata', {
        layers: [
          {
            'type': 'mapnik',
            'meta': {},
            'widgets': {
              'dataviewId1': {
                'url': {
                  'http': 'http://example.com/dataviewId1/' + i,
                  'https': 'https://example.com/dataviewId1/' + i
                }
              }
            }
          },
          {
            'type': 'mapnik',
            'meta': {},
            'widgets': {
              'dataviewId2': {
                'url': {
                  'http': 'http://example.com/dataviewId2/' + i,
                  'https': 'https://example.com/dataviewId2/' + i
                }
              }
            }
          }
        ]
      });

      args.success(this.dashboardInstance);
      i++;
    }.bind(this);

    var dataview1 = new HistogramDataviewModel({
      id: 'dataviewId1',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    });
    this.dataviews.add(dataview1);

    var dataview2 = new HistogramDataviewModel({
      id: 'dataviewId2',
      type: 'list'
    }, {
      layer: this.cartoDBLayer2
    });
    this.dataviews.add(dataview2);

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      dataviews: this.dataviews,
      map: this.map
    });

    expect(dataview1.get('url')).toEqual('http://example.com/dataviewId1/0');
    expect(dataview2.get('url')).toEqual('http://example.com/dataviewId2/0');

    // Bind some callbacks to check which change:url events do dataviews trigger
    var callback1 = jasmine.createSpy('callback1');
    var callback2 = jasmine.createSpy('callback2');

    dataview1.bind('change:url', callback1);
    dataview2.bind('change:url', callback2);

    // Filter has changed by cartoDBLayer1
    dataview1.trigger('change:filter', dataview1);

    expect(dataview1.get('url')).toEqual('http://example.com/dataviewId1/1');
    expect(dataview2.get('url')).toEqual('http://example.com/dataviewId2/1');

    // Layer1 was the one that triggered the change so only callback1 should have been called
    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});
