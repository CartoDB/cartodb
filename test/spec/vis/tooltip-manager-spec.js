var _ = require('underscore');
var Backbone = require('backbone');
var MapView = require('../../../src/geo/map-view');
var Map = require('../../../src/geo/map');
var VisModel = require('../../../src/vis/vis');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var LayersCollection = require('../../../src/geo/map/layers');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group');
var InfowindowModel = require('../../../src/geo/ui/infowindow-model');
var TooltipManager = require('../../../src/vis/tooltip-manager');

describe('src/vis/tooltip-manager.js', function () {
  beforeEach(function () {
    this.map = new Map(null, { layersFactory: {} });
    var layerView = this.layerView = new Backbone.View();
    var MyMapView = MapView.extend({
      _getLayerViewFactory: function () {
        return {
          createLayerView: function () {
            return layerView;
          }
        };
      }
    });

    this.mapView = new MyMapView({
      map: this.map,
      layerGroupModel: new Backbone.Model()
    });
    this.mapView.getNativeMap = function () {};
    this.mapView._addLayerToMap = function () {};
    this.mapView.latLonToPixel = function () { return { x: 0, y: 0 }; };
    this.mapView.getSize = function () { return { x: 1000, y: 1000 }; };
    this.vis = new VisModel();
    this.infowindowModel = new InfowindowModel();

    spyOn(this.vis, 'reload');
  });

  it('should add a new tooltip view to the map view when layers were previously reset', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    }, { vis: this.vis });

    this.map.layers.reset([ layer ]);

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    expect(this.mapView.addOverlay).toHaveBeenCalled();
  });

  it('should add a new tooltip view to the map view when new layers are reset', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    }, { vis: this.vis });

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addOverlay).toHaveBeenCalled();
  });

  it('should add a new tooltip view to the map view when new layers are added', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    }, { vis: this.vis });

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer ]);
    expect(this.mapView.addOverlay).toHaveBeenCalled();
  });

  it('should NOT add a new tooltip view to the map view when new layers share the same layerView', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }]
      }
    }, { vis: this.vis });

    var layer2 = new CartoDBLayer({
      tooltip: {
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }]
      }
    }, { vis: this.vis });

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer1, layer2 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    expect(this.mapView.addOverlay.calls.count()).toEqual(1);
  });

  it('should show the tooltip when a feature is hovered', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
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
    var layer2 = new CartoDBLayer({
      tooltip: {
        template: 'template2',
        template_type: 'underscore',
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names2'
      }
    }, { vis: this.vis });

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer1, layer2 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    var tooltipView = this.mapView.addOverlay.calls.mostRecent().args[0];

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1, layer2 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(tooltipView.model.get('pos')).toEqual({ x: 100, y: 200 });
    expect(tooltipView.model.get('fields')).toEqual([{
      'name': 'name',
      'title': true,
      'position': 1
    }]);
    expect(tooltipView.model.get('template')).toEqual('template1');
    expect(tooltipView.model.get('alternative_names')).toEqual('alternative_names1');
    expect(tooltipView.model.isVisible()).toBeTruthy();

    // Simulate the featureOver event on layer #1
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 200, y: 300 }, { cartodb_id: 10 }, 1);

    expect(tooltipView.model.get('pos')).toEqual({ x: 200, y: 300 });
    expect(tooltipView.model.get('fields')).toEqual([{
      'name': 'description',
      'title': true,
      'position': 1
    }]);
    expect(tooltipView.model.get('template')).toEqual('template2');
    expect(tooltipView.model.get('alternative_names')).toEqual('alternative_names2');
    expect(tooltipView.model.isVisible()).toBeTruthy();
  });

  it('should NOT show the tooltip when a feature is hovered and infowindow is opened', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
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
    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer1 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    var tooltipView = this.mapView.addOverlay.calls.mostRecent().args[0];

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(tooltipView.model.isVisible()).toBeTruthy();

    this.layerView.trigger('featureOut');

    expect(tooltipView.model.isVisible()).toBeFalsy();

    this.infowindowModel.setCurrentFeatureId(10);

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(tooltipView.model.isVisible()).toBeFalsy();
  });

  it('should hide the tooltip when a feature is not hovered anymore', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
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

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer1 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    var tooltipView = this.mapView.addOverlay.calls.mostRecent().args[0];

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(tooltipView.model.isVisible()).toBeTruthy();

    this.layerView.trigger('featureOut');

    expect(tooltipView.model.isVisible()).toBeFalsy();
  });

  it('should not show the tooltip if popups are disabled', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
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

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer1 ]);
    this.map.disablePopups();

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    var tooltipView = this.mapView.addOverlay.calls.mostRecent().args[0];

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10 }, 0);
    expect(tooltipView.model.isVisible()).toBeFalsy();
  });

  it('should not show the tooltip if tooltip has no template', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
        template: '',
        template_type: 'underscore',
        fields: [{
          'name': 'name',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names1'
      }
    }, { vis: this.vis });

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer1 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    var tooltipView = this.mapView.addOverlay.calls.mostRecent().args[0];

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10 }, 0);

    expect(tooltipView.model.isVisible()).toBeFalsy();
  });

  it('should bind the featureOver event to the corresponding layerView only once', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({
      tooltip: {
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
    var layer2 = new CartoDBLayer({
      tooltip: {
        template: 'template2',
        template_type: 'underscore',
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names2'
      }
    }, { vis: this.vis });

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    spyOn(this.layerView, 'bind');

    this.map.layers.reset([ layer1, layer2 ]);

    var featureOverBinds = _.select(this.layerView.bind.calls.all(), function (call) {
      return call.args[0] === 'featureOver';
    });
    expect(featureOverBinds.length).toEqual(1);
  });

  it('should not show the tooltipView if the layerModel doesn\'t have tooltip data', function () {
    spyOn(this.mapView, 'addOverlay');

    var layer1 = new CartoDBLayer({}, { vis: this.vis });
    var layer2 = new CartoDBLayer({
      tooltip: {
        template: 'template2',
        template_type: 'underscore',
        fields: [{
          'name': 'description',
          'title': true,
          'position': 1
        }],
        alternative_names: 'alternative_names2'
      }
    }, { vis: this.vis });

    new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapView: this.mapView,
      mapModel: this.map,
      infowindowModel: this.infowindowModel
    });

    this.map.layers.reset([ layer1, layer2 ]);

    expect(this.mapView.addOverlay).toHaveBeenCalled();
    var tooltipView = this.mapView.addOverlay.calls.mostRecent().args[0];

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1, layer2 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10 }, 0);

    expect(tooltipView.model.isVisible()).toBeFalsy();
  });
});
