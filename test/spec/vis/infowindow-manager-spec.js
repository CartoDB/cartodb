var _ = require('underscore');
var Backbone = require('backbone');
var MapView = require('../../../src/geo/map-view');
var Map = require('../../../src/geo/map');
var VisModel = require('../../../src/vis/vis');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group');
var InfowindowManager = require('../../../src/vis/infowindow-manager');

var createCartoDBLayer = function (vis, infowindowAttrs) {
  infowindowAttrs = infowindowAttrs || {
    fields: [{
      'name': 'name',
      'title': true,
      'position': 1
    }]
  };
  return new CartoDBLayer({
    infowindow: infowindowAttrs
  }, { vis: vis });
};

describe('src/vis/infowindow-manager.js', function () {
  beforeEach(function () {
    this.map = new Map({}, {
      layersFactory: {}
    });

    var cartoDBLayerGroup = new CartoDBLayerGroup({}, {
      layersCollection: this.map.layers
    });

    var layerView = this.layerView = new Backbone.Model();

    var MyMapView = MapView.extend({
      _getLayerViewFactory: function () {
        return {
          createLayerView: function () {
            return layerView;
          }
        };
      }
    });

    this.layerView.model = cartoDBLayerGroup;
    spyOn(cartoDBLayerGroup, 'fetchAttributes').and.callFake(function (layerIndex, featureId, callback) {
      callback({ name: 'juan' });
    });

    this.mapView = new MyMapView({
      map: this.map,
      layerGroupModel: new Backbone.Model()
    });

    spyOn(this.mapView, 'addInfowindow');
    this.mapView.getNativeMap = function () {};
    this.mapView._addLayerToMap = function () {};
    this.mapView.latLonToPixel = function () { return { x: 0, y: 0 }; };
    this.mapView.getSize = function () { return { x: 1000, y: 1000 }; };

    this.vis = new VisModel();
    spyOn(this.vis, 'reload');
  });

  it('should add a new infowindow view to the map view when new layers were previously reset', function () {
    var layer = createCartoDBLayer(this.vis);

    this.map.layers.reset([ layer ]);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    expect(this.mapView.addInfowindow).toHaveBeenCalled();
  });

  it('should add a new infowindow view to the map view when new layers are reset', function () {
    var layer = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addInfowindow).toHaveBeenCalled();
  });

  it('should add a new infowindow view to the map view when new layers are added', function () {
    var layer = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addInfowindow).toHaveBeenCalled();
  });

  it('should NOT add a new infowindow view to the map view when new layers share the same layerView', function () {
    var layer1 = createCartoDBLayer(this.vis);
    var layer2 = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);
    expect(this.mapView.addInfowindow).toHaveBeenCalled();
    expect(this.mapView.addInfowindow.calls.count()).toEqual(1);
  });

  it('should correctly bind the featureClick event to the corresponding layerView', function () {
    var layer1 = createCartoDBLayer(this.vis, {
      template: 'template1',
      template_type: 'underscore',
      fields: [{
        'name': 'name',
        'title': true,
        'position': 1
      }],
      alternative_names: 'alternative_names1'
    });

    var layer2 = createCartoDBLayer(this.vis, {
      template: 'template2',
      template_type: 'underscore',
      fields: [{
        'name': 'description',
        'title': true,
        'position': 1
      }],
      alternative_names: 'alternative_names2'
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    var infowindowModel = infowindowView.model;
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
      'alternative_names': 'alternative_names1',
      'template_type': 'underscore',
      'offset': [
        28,
        0
      ],
      'maxHeight': 180,
      'autoPan': true,
      'content': {
        'fields': [
          {
            'name': 'name',
            'title': 'name',
            'value': 'juan',
            'index': 0
          }
        ],
        'data': {
          'name': 'juan'
        }
      },
      'latlng': [
        100,
        200
      ],
      'visibility': true
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
      'alternative_names': 'alternative_names2',
      'template_type': 'underscore',
      'offset': [
        28,
        0
      ],
      'maxHeight': 180,
      'autoPan': true,
      'content': {
        'fields': [
          {
            'title': null,
            'value': 'No data available',
            'index': 0,
            'type': 'empty'
          }
        ],
        'data': {
          'name': 'juan'
        }
      },
      'latlng': [
        100,
        200
      ],
      'visibility': true
    });
  });

  it('should not fetch attributes and show the infowindow if popups are disabled', function () {
    var layer1 = createCartoDBLayer(this.vis, {
      template: 'template1',
      template_type: 'underscore',
      fields: [{
        'name': 'name',
        'title': true,
        'position': 1
      }],
      alternative_names: 'alternative_names1'
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1 ]);
    this.map.disablePopups();

    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    var infowindowModel = infowindowView.model;

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(this.layerView.model.fetchAttributes).not.toHaveBeenCalled();
    expect(infowindowModel.get('visibility')).toEqual(false);
  });

  it('should bind the featureClick event to the corresponding layerView only once', function () {
    var layer1 = createCartoDBLayer(this.vis);
    var layer2 = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    spyOn(this.layerView, 'bind');

    this.map.layers.reset([ layer1, layer2 ]);

    var featureClickBinds = _.select(this.layerView.bind.calls.all(), function (call) {
      return call.args[0] === 'featureClick';
    });
    expect(featureClickBinds.length).toEqual(1);
  });

  it('should hide the infowindow if map popups are disabled', function () {
    var layer1 = createCartoDBLayer(this.vis, {
      template: 'template1',
      template_type: 'underscore',
      fields: [{
        'name': 'name',
        'title': true,
        'position': 1
      }],
      alternative_names: 'alternative_names1'
    });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    spyOn(infowindowView, 'adjustPan');
    var infowindowModel = infowindowView.model;

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(infowindowModel.get('visibility')).toEqual(true);

    // Disable Map Popups
    this.map.disablePopups();

    expect(infowindowModel.get('visibility')).toEqual(false);
  });

  it('should set loading content while loading', function () {
    var layer1 = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    spyOn(infowindowView, 'adjustPan');
    var infowindowModel = infowindowView.model;

    // Fetch attributes does NOT suceed inmediatily
    this.layerView.model.fetchAttributes.and.callFake(function () {});

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    // InfowindowModel has been updated
    expect(infowindowModel.get('content').fields).toEqual([
      {
        'type': 'loading',
        'title': 'loading',
        'value': '…'
      }
    ]);
    expect(infowindowView.model.get('visibility')).toBe(true);
  });

  it('should set error content if no attributes are returned', function () {
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
    }, { vis: this.vis });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    var infowindowModel = infowindowView.model;
    spyOn(infowindowView, 'adjustPan');

    this.layerView.model.fetchAttributes.and.callFake(function (layerIndex, featureId, callback) {
      callback();
    });

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    // InfowindowModel has been updated
    expect(infowindowModel.get('content').fields).toEqual([
      {
        'title': null,
        'alternative_name': null,
        'value': 'There has been an error...',
        'index': null,
        'type': 'error'
      }
    ]);
    expect(infowindowView.model.get('visibility')).toBe(true);
  });

  it('should set a filter on the tooltipView if the layer has tooltip too', function () {
    // Simulate that the layerView has been added a tooltipView
    var tooltipView = jasmine.createSpyObj('tooltipView', ['setFilter', 'hide']);
    tooltipView.setFilter.and.returnValue(tooltipView);
    this.layerView.tooltipView = tooltipView;

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
    }, { vis: this.vis });

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(this.layerView.tooltipView.setFilter).toHaveBeenCalled();
    var filterFunction = this.layerView.tooltipView.setFilter.calls.mostRecent().args[0];

    expect(filterFunction({ cartodb_id: 10 })).toBeFalsy();
    expect(filterFunction({ cartodb_id: 0 })).toBeTruthy();
  });

  it('should clear the filter on the tooltipView when the infowindow is hidden', function () {
    // Simulate that the layerView has been added a tooltipView
    var tooltipView = jasmine.createSpyObj('tooltipView', ['setFilter', 'hide']);
    tooltipView.setFilter.and.returnValue(tooltipView);
    this.layerView.tooltipView = tooltipView;

    var layer = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    this.layerView.tooltipView.setFilter.calls.reset();

    infowindowView.model.set('visibility', false);

    expect(this.layerView.tooltipView.setFilter).toHaveBeenCalledWith(null);
  });

  it('should reload the map when the infowindow template gets new fields', function () {
    var layer = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);

    layer.infowindow.update({
      fields: [
        {
          'name': 'description',
          'title': true,
          'position': 1
        }
      ]
    });

    expect(this.vis.reload).toHaveBeenCalledWith({});
  });

  it('should reload the map and fetch attributes when the infowindow template is active (visible) and it gets fields', function () {
    var layer = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer ]);

    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    spyOn(infowindowView, 'adjustPan');

    infowindowManager._infowindowModel.setInfowindowTemplate(layer.infowindow);
    infowindowManager._infowindowModel.set('visibility', true);

    this.vis.reload.calls.reset();

    layer.infowindow.update({
      fields: [
        {
          'name': 'description',
          'title': true,
          'position': 1
        }
      ]
    });

    expect(this.vis.reload.calls.argsFor(0)[0].success).toEqual(jasmine.any(Function));
  });

  it('should hide the infowindow when fields are cleared in the infowindow template', function () {
    // Simulate that the layerView has been added a tooltipView
    var tooltipView = jasmine.createSpyObj('tooltipView', ['setFilter', 'hide']);
    tooltipView.setFilter.and.returnValue(tooltipView);
    this.layerView.tooltipView = tooltipView;

    var layer1 = createCartoDBLayer(this.vis);
    var layer2 = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);

    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];

    spyOn(infowindowView, 'adjustPan');
    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(infowindowView.model.get('visibility')).toBe(true);

    // Clear fields on layer #1
    layer2.infowindow.update({
      fields: []
    });

    // Nothing happened
    expect(infowindowView.model.get('visibility')).toBe(true);
    expect(this.vis.reload).not.toHaveBeenCalledWith({});

    // Clear fields on layer #0 (the one that was opened)
    layer1.infowindow.update({
      fields: []
    });

    // Infowindow has been closed and map has NOT been reloaded
    expect(infowindowView.model.get('visibility')).toBe(false);
    expect(this.vis.reload).not.toHaveBeenCalledWith({});
  });

  it('should hide the infowindow if the layer is hidden', function () {
    var layer1 = createCartoDBLayer(this.vis);
    var layer2 = createCartoDBLayer(this.vis);

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1, layer2 ]);

    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(infowindowView.model.get('visibility')).toBe(true);

    // hide layer2 -> nothing happens
    layer2.hide();

    expect(infowindowView.model.get('visibility')).toBe(true);

    // hide layer1 -> infowindow is hidden
    layer1.hide();

    expect(infowindowView.model.get('visibility')).toBe(false);
  });
});
