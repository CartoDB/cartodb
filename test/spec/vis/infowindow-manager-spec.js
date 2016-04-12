var _ = require('underscore');
var Backbone = require('backbone');
var MapView = require('../../../src/geo/map-view');
var Map = require('../../../src/geo/map');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var InfowindowManager = require('../../../src/vis/infowindow-manager');

describe('src/vis/infowindow-manager.js', function () {
  beforeEach(function () {
    var windshaftMap = new Backbone.Model({});
    this.map = new Map({}, {
      windshaftMap: windshaftMap
    });
    this.layerView = new Backbone.Model();
    var layerViewFactory = jasmine.createSpyObj('layerViewFactory', ['createLayerView']);
    layerViewFactory.createLayerView.and.returnValue(this.layerView);

    this.mapView = new MapView({
      map: this.map,
      layerViewFactory: layerViewFactory,
      layerGroupModel: new Backbone.Model()
    });
    this.mapView.getNativeMap = function () {};
    this.mapView._addLayerToMap = function () {};
    this.mapView.latLonToPixel = function () { return { x: 0, y: 0 }; };
    this.mapView.getSize = function () { return { x: 1000, y: 1000 }; };

    this.vis = {
      mapView: this.mapView
    };
  });

  it('should add a new infowindow view to the map view when new layers are reseted', function () {
    spyOn(this.mapView, 'addInfowindow');

    var layer = new CartoDBLayer({
      infowindow: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addInfowindow).toHaveBeenCalled();
  });

  it('should add a new infowindow view to the map view when new layers are added', function () {
    spyOn(this.mapView, 'addInfowindow');

    var layer = new CartoDBLayer({
      infowindow: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addInfowindow).toHaveBeenCalled();
  });

  it('should NOT add a new infowindow view to the map view when new layers share the same layerView', function () {
    spyOn(this.mapView, 'addInfowindow');

    var layer1 = new CartoDBLayer({
      infowindow: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    });

    var layer2 = new CartoDBLayer({
      infowindow: {
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }]
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);
    expect(this.mapView.addInfowindow).toHaveBeenCalled();
    expect(this.mapView.addInfowindow.calls.count()).toEqual(1);
  });

  it('should NOT add a new infowindow view to the map view when new layers are added if layer doesn\'t have infowindow fields', function () {
    spyOn(this.mapView, 'addInfowindow');

    var layer = new CartoDBLayer({
      infowindow: {
        fields: []
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addInfowindow).not.toHaveBeenCalled();
  });

  it('should correctly bind the featureClick event to the corresponding layerView (when layerView has a group of layers)', function () {
    spyOn(this.mapView, 'addInfowindow');

    var layer1 = new CartoDBLayer({
      infowindow: {
        template: 'template1',
        template_type: 'underscore',
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names1'
      }
    });

    var layer2 = new CartoDBLayer({
      infowindow: {
        template: 'template2',
        template_type: 'underscore',
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names2'
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    var infowindowModel = infowindowView.model;

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes').and.callFake(function (layerIndex, cartoDBId, callback) {
        callback({ name: 'juan' });
      }),
      layers: new Backbone.Collection([ layer1, layer2 ])
    };
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    // A request to fetch the attributes for the right cartodb_id and layerIndex has been triggered
    expect(this.layerView.model.fetchAttributes.calls.count()).toEqual(1);
    expect(this.layerView.model.fetchAttributes).toHaveBeenCalledWith(0, 10, jasmine.any(Function));
    this.layerView.model.fetchAttributes.calls.reset();

    // InfowindowModel has been updated
    expect(infowindowModel.attributes).toEqual({
      'template': 'template1',
      'template_type': 'underscore',
      'alternative_names': 'alternative_names1',
      'fields': [
        {
          'name': 'name',
          'title': true,
          'position': 1
        }
      ],
      'template_name': 'infowindow_light',
      'latlng': [
        100,
        200
      ],
      'offset': [
        28,
        0
      ],
      'maxHeight': 180,
      'autoPan': true,
      'content': {
        'fields': [
          {
            'type': 'loading',
            'title': 'loading',
            'value': '…'
          }
        ]
      },
      'visibility': true,
      'sanitizeTemplate': undefined,
      'width': undefined
    });

    // Simulate the featureClick event for layer #1
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 100 }, 1);

    // A request to fetch the attributes for the right cartodb_id and layerIndex has been triggered
    expect(this.layerView.model.fetchAttributes.calls.count()).toEqual(1);
    expect(this.layerView.model.fetchAttributes).toHaveBeenCalledWith(1, 100, jasmine.any(Function));
    this.layerView.model.fetchAttributes.calls.reset();

    // InfowindowModel has been updated
    expect(infowindowModel.attributes).toEqual({
      'template': 'template2',
      'template_type': 'underscore',
      'alternative_names': 'alternative_names2',
      'fields': [
        {
          'name': 'description',
          'title': true,
          'position': 1
        }
      ],
      'template_name': 'infowindow_light',
      'latlng': [
        100,
        200
      ],
      'offset': [
        28,
        0
      ],
      'maxHeight': 180,
      'autoPan': true,
      'content': {
        'fields': [
          {
            'type': 'loading',
            'title': 'loading',
            'value': '…'
          }
        ]
      },
      'visibility': true,
      'sanitizeTemplate': undefined,
      'width': undefined
    });
  });

  it('should correctly bind the featureClick event to the corresponding layerView (when layerView has a single layer)', function () {
    spyOn(this.mapView, 'addInfowindow');

    var layer = new CartoDBLayer({
      infowindow: {
        template: 'template1',
        template_type: 'underscore',
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names1'
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    var infowindowModel = infowindowView.model;

    this.layerView.model = layer;
    layer.fetchAttributes = jasmine.createSpy('fetchAttributes').and.callFake(function (layerIndex, cartoDBId, callback) {
      callback({ name: 'juan' });
    });
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    // A request to fetch the attributes for the right cartodb_id and layerIndex has been triggered
    expect(this.layerView.model.fetchAttributes.calls.count()).toEqual(1);
    expect(this.layerView.model.fetchAttributes).toHaveBeenCalledWith(0, 10, jasmine.any(Function));
    this.layerView.model.fetchAttributes.calls.reset();

    // InfowindowModel has been updated
    expect(infowindowModel.attributes).toEqual({
      'template': 'template1',
      'template_type': 'underscore',
      'alternative_names': 'alternative_names1',
      'fields': [
        {
          'name': 'name',
          'title': true,
          'position': 1
        }
      ],
      'template_name': 'infowindow_light',
      'latlng': [
        100,
        200
      ],
      'offset': [
        28,
        0
      ],
      'maxHeight': 180,
      'autoPan': true,
      'content': {
        'fields': [
          {
            'type': 'loading',
            'title': 'loading',
            'value': '…'
          }
        ]
      },
      'visibility': true,
      'sanitizeTemplate': undefined,
      'width': undefined
    });
  });

  it('should bind the featureClick event to the corresponding layerView only once', function () {
    spyOn(this.mapView, 'addInfowindow');

    var layer1 = new CartoDBLayer({
      infowindow: {
        template: 'template1',
        template_type: 'underscore',
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names1'
      }
    });

    var layer2 = new CartoDBLayer({
      infowindow: {
        template: 'template2',
        template_type: 'underscore',
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names2'
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    spyOn(this.layerView, 'bind');

    this.map.layers.reset([ layer1, layer2 ]);

    var featureClickBinds = _.select(this.layerView.bind.calls.all(), function (call) {
      return call.args[0] === 'featureClick';
    });
    expect(featureClickBinds.length).toEqual(1);
  });

  it('should set a filter on the tooltipView if the layer has tooltip too', function () {
    // Simulate that the layerView has been added a tooltipView
    var tooltipView = jasmine.createSpyObj('tooltipView', ['setFilter', 'hide']);
    tooltipView.setFilter.and.returnValue(tooltipView);
    this.layerView.tooltipView = tooltipView;

    spyOn(this.mapView, 'addInfowindow');

    var layer = new CartoDBLayer({
      infowindow: {
        template: 'template',
        template_type: 'underscore',
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names'
      }
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes').and.returnValue({ name: 'Juan' }),
      layers: new Backbone.Collection([ layer ])
    };
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(this.layerView.tooltipView.setFilter).toHaveBeenCalled();
    var filterFunction = this.layerView.tooltipView.setFilter.calls.mostRecent().args[0];

    expect(filterFunction({ cartodb_id: 10 })).toBeFalsy();
    expect(filterFunction({ cartodb_id: 0 })).toBeTruthy();
  });
});
