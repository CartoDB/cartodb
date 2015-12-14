var $ = cdb.$
var _ = cdb._
var Backbone = cdb.Backbone
var Map = cdb.geo.Map
var CartoDBLayer = cdb.geo.CartoDBLayer
var TorqueLayer = cdb.geo.TorqueLayer
var Dashboard = require('app/windshaft/dashboard')
var DashboardInstance = require('app/windshaft/dashboard-instance')
var HistogramModel = require('app/widgets/histogram/model')
var CategoryFilter = require('app/windshaft/filters/category')

describe('windshaft/dashboard', function () {
  beforeEach(function () {
    // Disable ajax
    this.ajax = $.ajax
    $.ajax = function () {}

    // Disable debounce for these tests
    this.debounce = _.debounce
    _.debounce = function (func) { return function () { func.apply(this, arguments) } }

    this.dashboardInstance = new DashboardInstance({
      metadata: {
        layers: [
          {
            'type': 'mapnik',
            'meta': {},
            'widgets': {
              'widgetId': {
                'url': {
                  'http': 'http://example.com',
                  'https': 'https://example.com'
                }
              }
            }
          }
        ]
      }
    })
    this.widgets = new Backbone.Collection()

    spyOn(this.dashboardInstance, 'getBaseURL').and.returnValue('baseURL')
    spyOn(this.dashboardInstance, 'getTiles').and.callFake(function (type) {
      if (type === 'torque') {
        return 'torqueTileURLs'
      }
      return 'tileURLs'
    })

    this.client = {
      instantiateMap: function (options) {
        options.success(this.dashboardInstance)
      }.bind(this)
    }

    this.configGenerator = {
      generate: function () {}
    }

    this.map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    })

    this.cartoDBLayerGroup = new Backbone.Model()
    this.cartoDBLayer1 = new CartoDBLayer({ id: '12345-67890' })
    this.cartoDBLayer2 = new CartoDBLayer({ id: '09876-54321' })
    this.torqueLayer = new TorqueLayer()
  })

  afterEach(function () {
    $.ajax = this.ajax

    _.debounce = this.debounce
  })

  it('should create an instance of the dashboard and update the URLs of layers and widgets', function () {
    var widget = new HistogramModel({
      id: 'widgetId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    })
    this.widgets.add(widget)

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ],
      widgets: this.widgets,
      map: this.map
    })

    // urls of the layerGroup have been updated
    expect(this.cartoDBLayerGroup.get('baseURL')).toEqual('baseURL')
    expect(this.cartoDBLayerGroup.get('urls')).toEqual('tileURLs')

    // urls of torque layers have been updated too!
    expect(this.torqueLayer.get('urls')).toEqual('torqueTileURLs')

    // url of widget have been updated
    expect(widget.url()).toEqual('http://example.com')
  })

  it('should pass the filters of visible layers to create the instance', function () {
    spyOn(this.client, 'instantiateMap')

    var filter = new CategoryFilter({ layerIndex: 0 })
    spyOn(filter, 'isEmpty').and.returnValue(false)
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' })

    var widget = new HistogramModel({
      id: 'widgetId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1,
      filter: filter
    })

    this.widgets.add(widget)

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      widgets: this.widgets,
      map: this.map
    })

    expect(this.client.instantiateMap.calls.mostRecent().args[0].filters).toEqual({
      layers: [{
        something: 'else'
      }]
    })

    // Hide the layer
    this.cartoDBLayer1.set('visible', false)

    // client.instantiateMap has been called again, but this time no filters are passed
    expect(this.client.instantiateMap.calls.mostRecent().args[0].filters).toEqual({})
  })

  it('should update the urls of widgets when bounding box changes', function () {
    this.client.instantiateMap = function (args) {
      this.dashboardInstance.set({
        layergroupid: 'dashboardId',
        metadata: {
          layers: [
            {
              'type': 'mapnik',
              'meta': {},
              'widgets': {
                'widgetId': {
                  'url': {
                    'http': 'http://example.com/widgetId',
                    'https': 'https://example.comwidgetId'
                  }
                }
              }
            }
          ]
        }
      })
      args.success(this.dashboardInstance)
    }.bind(this)

    var widget = new HistogramModel({
      id: 'widgetId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    })
    this.widgets.add(widget)

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1 ],
      widgets: this.widgets,
      map: this.map
    })

    // url of widget have been updated
    expect(widget.url()).toEqual('http://example.com/widgetId')

    // This widgets needs this attribute to be true in order to submit the bbox filter
    widget.set('submitBBox', true)

    // Map bounds changes and event is triggered
    this.map.setBounds([['s', 'w'], ['n', 'e']])
    this.map.trigger('change:center')

    // widget url has been updated and now includes the bounding box filter
    expect(widget.url()).toEqual('http://example.com/widgetId?bbox=w,s,e,n')
  })

  it('should create a new instance when some attributes of a layer changes', function () {
    spyOn(this.client, 'instantiateMap')

    var widget = new HistogramModel({
      id: 'widgetId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    })
    this.widgets.add(widget)

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      widgets: this.widgets,
      map: this.map
    })

    expect(this.client.instantiateMap.calls.count()).toEqual(1)

    // Hide the layer
    this.cartoDBLayer1.set('visible', false)

    expect(this.client.instantiateMap.calls.count()).toEqual(2)
  })

  it('should create a new instance when the filter of a layer changes', function () {
    spyOn(this.client, 'instantiateMap')

    var filter = new CategoryFilter({ layerIndex: 0 })
    spyOn(filter, 'isEmpty').and.returnValue(false)
    spyOn(filter, 'toJSON').and.returnValue({ something: 'else' })

    var widget = new HistogramModel({
      id: 'widgetId',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1,
      filter: filter
    })
    this.widgets.add(widget)

    new Dashboard({ // eslint-disable-line
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      widgets: this.widgets,
      map: this.map
    })

    expect(this.client.instantiateMap.calls.count()).toEqual(1)

    // Filter has changed
    widget.trigger('change:filter', widget)

    expect(this.client.instantiateMap.calls.count()).toEqual(2)
  })

  it('should refresh the URLs of widgets and only trigger a change event if the widget belongs to the layer that changed', function () {
    var i = 0
    this.client.instantiateMap = function (args) {
      this.dashboardInstance.set('metadata', {
        layers: [
          {
            'type': 'mapnik',
            'meta': {},
            'widgets': {
              'widgetId1': {
                'url': {
                  'http': 'http://example.com/widgetId1/' + i,
                  'https': 'https://example.com/widgetId1/' + i
                }
              }
            }
          },
          {
            'type': 'mapnik',
            'meta': {},
            'widgets': {
              'widgetId2': {
                'url': {
                  'http': 'http://example.com/widgetId2/' + i,
                  'https': 'https://example.com/widgetId2/' + i
                }
              }
            }
          }
        ]
      })

      args.success(this.dashboardInstance)
      i++
    }.bind(this)

    var widget1 = new HistogramModel({
      id: 'widgetId1',
      type: 'list'
    }, {
      layer: this.cartoDBLayer1
    })
    this.widgets.add(widget1)

    var widget2 = new HistogramModel({
      id: 'widgetId2',
      type: 'list'
    }, {
      layer: this.cartoDBLayer2
    })
    this.widgets.add(widget2)

    new Dashboard({ // eslint-disable-line 
      client: this.client,
      configGenerator: this.configGenerator,
      statTag: 'stat_tag',
      layerGroup: this.cartoDBLayerGroup,
      layers: [ this.cartoDBLayer1, this.cartoDBLayer2 ],
      widgets: this.widgets,
      map: this.map
    })

    expect(widget1.get('url')).toEqual('http://example.com/widgetId1/0')
    expect(widget2.get('url')).toEqual('http://example.com/widgetId2/0')

    // Bind some callbacks to check which change:url events do widgets trigger
    var callback1 = jasmine.createSpy('callback1')
    var callback2 = jasmine.createSpy('callback2')

    widget1.bind('change:url', callback1)
    widget2.bind('change:url', callback2)

    // Filter has changed by cartoDBLayer1
    widget1.trigger('change:filter', widget1)

    expect(widget1.get('url')).toEqual('http://example.com/widgetId1/1')
    expect(widget2.get('url')).toEqual('http://example.com/widgetId2/1')

    // Layer1 was the one that triggered the change so only callback1 should have been called
    expect(callback1).toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
  })
})
