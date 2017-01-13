var Backbone = require('backbone');
var Map = require('../../../src/geo/map');
var VisModel = require('../../../src/vis/vis');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var LayersCollection = require('../../../src/geo/map/layers');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group');
var TooltipModel = require('../../../src/geo/ui/tooltip-model');
var InfowindowModel = require('../../../src/geo/ui/infowindow-model');
var TooltipManager = require('../../../src/vis/tooltip-manager');

describe('src/vis/tooltip-manager.js', function () {
  beforeEach(function () {
    this.map = new Map(null, { layersFactory: {} });
    this.layerView = new Backbone.View();

    this.vis = new VisModel();
    spyOn(this.vis, 'reload');

    this.tooltipModel = new TooltipModel();
    this.infowindowModel = new InfowindowModel();

    this.tooltipManager = new TooltipManager({ // eslint-disable-line
      visModel: this.vis,
      mapModel: this.map,
      tooltipModel: this.tooltipModel,
      infowindowModel: this.infowindowModel
    });
  });

  it('should show the tooltip when a feature is hovered', function () {
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

    this.tooltipManager.start(this.layerView);

    this.map.layers.reset([ layer1, layer2 ]);

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1, layer2 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(this.tooltipModel.get('position')).toEqual({ x: 100, y: 200 });
    expect(this.tooltipModel.get('fields')).toEqual([{
      'name': 'name',
      'title': true,
      'position': 1
    }]);
    expect(this.tooltipModel.get('template')).toEqual('template1');
    expect(this.tooltipModel.get('alternative_names')).toEqual('alternative_names1');
    expect(this.tooltipModel.isVisible()).toBeTruthy();

    // Simulate the featureOver event on layer #1
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 200, y: 300 }, { cartodb_id: 10 }, 1);

    expect(this.tooltipModel.get('position')).toEqual({ x: 200, y: 300 });
    expect(this.tooltipModel.get('fields')).toEqual([{
      'name': 'description',
      'title': true,
      'position': 1
    }]);
    expect(this.tooltipModel.get('template')).toEqual('template2');
    expect(this.tooltipModel.get('alternative_names')).toEqual('alternative_names2');
    expect(this.tooltipModel.isVisible()).toBeTruthy();
  });

  it('should NOT show the tooltip when a feature is hovered and infowindow is opened', function () {
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

    this.tooltipManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(this.tooltipModel.isVisible()).toBeTruthy();

    this.layerView.trigger('featureOut');

    expect(this.tooltipModel.isVisible()).toBeFalsy();

    this.infowindowModel.setCurrentFeatureId(10);

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(this.tooltipModel.isVisible()).toBeFalsy();
  });

  it('should hide the tooltip when a feature is not hovered anymore', function () {
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

    this.tooltipManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10, name: 'CARTO' }, 0);

    expect(this.tooltipModel.isVisible()).toBeTruthy();

    this.layerView.trigger('featureOut');

    expect(this.tooltipModel.isVisible()).toBeFalsy();
  });

  it('should not show the tooltip if popups are disabled', function () {
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

    this.tooltipManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);
    this.map.disablePopups();

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10 }, 0);
    expect(this.tooltipModel.isVisible()).toBeFalsy();
  });

  it('should not show the tooltip if tooltip has no template', function () {
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

    this.tooltipManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10 }, 0);

    expect(this.tooltipModel.isVisible()).toBeFalsy();
  });

  it('should not show the tooltipView if the layerModel doesn\'t have tooltip data', function () {
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

    this.tooltipManager.start(this.layerView);

    this.map.layers.reset([ layer1, layer2 ]);

    this.layerView.model = new CartoDBLayerGroup({}, {
      layersCollection: new LayersCollection([ layer1, layer2 ])
    });

    // Simulate the featureOver event on layer #0
    this.layerView.trigger('featureOver', {}, [0, 0], { x: 100, y: 200 }, { cartodb_id: 10 }, 0);

    expect(this.tooltipModel.isVisible()).toBeFalsy();
  });
});
