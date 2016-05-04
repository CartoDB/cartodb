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

  it('should correctly bind the featureClick event to the corresponding layerView', function () {
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
      getLayerAt: function (index) {
        if (index === 0) {
          return layer1;
        }
        return layer2;
      },

      getIndexOf: function (layerModel) {
        if (layerModel === layer1) {
          return 0;
        }
        return 1;
      }
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
      'alternative_names': 'alternative_names1',
      'fields': [
        {
          'name': 'name',
          'title': true,
          'position': 1
        }
      ],
      'template_name': 'infowindow_light',
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
      'fields': [
        {
          'name': 'description',
          'title': true,
          'position': 1
        }
      ],
      'template_name': 'infowindow_light',
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

  it('should NOT fetch the attributes when clicking on the same feature twice', function () {
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

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes').and.callFake(function (layerIndex, cartoDBId, callback) {
        callback({ name: 'juan' });
      }),
      getLayerAt: function (index) {
        if (index === 0) {
          return layer1;
        }
      },

      getIndexOf: function (layerModel) {
        if (layerModel === layer1) {
          return 0;
        }
        return 1;
      }
    };
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    // A request to fetch the attributes for the right cartodb_id and layerIndex has been triggered
    expect(this.layerView.model.fetchAttributes.calls.count()).toEqual(1);
    expect(this.layerView.model.fetchAttributes).toHaveBeenCalledWith(0, 10, jasmine.any(Function));
    this.layerView.model.fetchAttributes.calls.reset();

    // Simulate another featureClick event for layer #0 and the same feature
    this.layerView.trigger('featureClick', {}, [100, 300], undefined, { cartodb_id: 10 }, 0);

    expect(this.layerView.model.fetchAttributes).not.toHaveBeenCalled();
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

  it('should set loading content while loading', function () {
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

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    var infowindowModel = infowindowView.model;

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes'),
      getLayerAt: function (index) {
        return layer1;
      },

      getIndexOf: function (layerModel) {
        return 0;
      }
    };
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    // InfowindowModel has been updated
    expect(infowindowModel.attributes).toEqual({
      'template': 'template1',
      'alternative_names': 'alternative_names1',
      'fields': [
        {
          'name': 'name',
          'title': true,
          'position': 1
        }
      ],
      'template_name': 'infowindow_light',
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
            'type': 'loading',
            'title': 'loading',
            'value': '…'
          }
        ]
      },
      'latlng': [
        100,
        200
      ],
      'visibility': true
    });
  });

  it('should set error content if no attributes are returned', function () {
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

    var infowindowManager = new InfowindowManager(this.vis);
    infowindowManager.manage(this.mapView, this.map);

    this.map.layers.reset([ layer1 ]);
    var infowindowView = this.mapView.addInfowindow.calls.mostRecent().args[0];
    var infowindowModel = infowindowView.model;

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes').and.callFake(function (layerIndex, cartoDBId, callback) {
        callback();
      }),

      getLayerAt: function (index) {
        return layer1;
      },

      getIndexOf: function (layerModel) {
        return 0;
      }
    };
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event for layer #0
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    // InfowindowModel has been updated
    expect(infowindowModel.attributes).toEqual({
      'template': 'template1',
      'alternative_names': 'alternative_names1',
      'fields': [
        {
          'name': 'name',
          'title': true,
          'position': 1
        }
      ],
      'template_name': 'infowindow_light',
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
            'alternative_name': null,
            'value': 'There has been an error...',
            'index': null,
            'type': 'error'
          }
        ],
        'data': {}
      },
      'latlng': [
        100,
        200
      ],
      'visibility': true
    });
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
      fetchAttributes: jasmine.createSpy('fetchAttributes'),
      getLayerAt: function (index) {
        return layer;
      },

      getIndexOf: function (layerModel) {
        return 0;
      }
    };
    spyOn(infowindowView, 'adjustPan');

    // Simulate the featureClick event
    this.layerView.trigger('featureClick', {}, [100, 200], undefined, { cartodb_id: 10 }, 0);

    expect(this.layerView.tooltipView.setFilter).toHaveBeenCalled();
    var filterFunction = this.layerView.tooltipView.setFilter.calls.mostRecent().args[0];

    expect(filterFunction({ cartodb_id: 10 })).toBeFalsy();
    expect(filterFunction({ cartodb_id: 0 })).toBeTruthy();
  });

  it('should reload the map when the infowindow template gets new fields', function () {
    spyOn(this.map, 'reload');

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

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes').and.returnValue({ description: 'THE DESCRIPTION' }),
      getLayerAt: function (index) {
        return layer;
      },

      getIndexOf: function (layerModel) {
        return 0;
      }
    };

    layer.infowindow.set('fields', [
      {
        'name': 'description',
        'title': true,
        'position': 1
      }
    ]);

    expect(this.map.reload).toHaveBeenCalledWith({});
  });

  it('should reload the map and fetch attributes when the infowindow template is active (visible) and it gets fields', function () {
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
    spyOn(infowindowView, 'adjustPan');

    this.layerView.model = {
      fetchAttributes: jasmine.createSpy('fetchAttributes').and.returnValue({ description: 'THE DESCRIPTION' }),
      getLayerAt: function (index) {
        return layer;
      },

      getIndexOf: function (layerModel) {
        return 0;
      }
    };

    infowindowManager._infowindowModel.setInfowindowTemplate(layer.infowindow);
    infowindowManager._infowindowModel.set('visibility', true);

    spyOn(this.map, 'reload');

    layer.infowindow.set('fields', [
      {
        'name': 'description',
        'title': true,
        'position': 1
      }
    ]);

    expect(this.map.reload.calls.argsFor(0)[0].success).toEqual(jasmine.any(Function));
  });
});
