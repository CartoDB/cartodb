var Backbone = require('backbone');
var MapView = require('../../../src/geo/map-view');
var Map = require('../../../src/geo/map');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var InfowindowManager = require('../../../src/vis/infowindow-manager');

describe('src/vis/infowindow-manager.js', function () {
  beforeEach(function () {
    var windshaftMap = new Backbone.Model({});
    windshaftMap.isNamedMap = function () { return false; };
    this.map = new Map({}, {
      windshaftMap: windshaftMap
    });
    this.layerView = new Backbone.Model();
    var layerViewFactory = jasmine.createSpyObj('layerViewFactory', ['createLayerView']);
    layerViewFactory.createLayerView.and.returnValue(this.layerView);

    this.mapView = new MapView({
      map: this.map,
      layerViewFactory: layerViewFactory
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

  it('should correctly bind the featureClick event to the corresponding layerView', function () {
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
    var infowindowModel = infowindowView.model;

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes').and.returnValue({ name: 'Juan' })
    };
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 1);

    // A request to fetch the attributes for the right cartodb_id and layerIndex has been triggered
    expect(this.layerView.model.fetchAttributes).toHaveBeenCalledWith(1, 10, jasmine.any(Function));

    // InfowindowModel has been updated
    expect(infowindowModel.attributes).toEqual({
      'template': 'template',
      'template_type': 'underscore',
      'alternative_names': 'alternative_names',
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
      'visibility': true
    });
  });
});
