var Backbone = require('backbone');
var Map = require('../../../src/geo/map');
var VisModel = require('../../../src/vis/vis');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group');

var TooltipModel = require('../../../src/geo/ui/tooltip-model');
var InfowindowModel = require('../../../src/geo/ui/infowindow-model');

var InfowindowManager = require('../../../src/vis/infowindow-manager');

var createCartoDBLayer = function (vis, infowindowAttrs) {
  infowindowAttrs = infowindowAttrs || {
    fields: [{
      'name': 'name',
      'title': true,
      'position': 1
    }],
    template: '<p>{{ name }}</p>'
  };
  return new CartoDBLayer({
    infowindow: infowindowAttrs
  }, { vis: vis });
};

var simulateFeatureClickEvent = function (layerView, data) {
  layerView.trigger('featureClick', {
    layer: layerView.model.getLayerInLayerGroupAt(data.layerIndex),
    layerIndex: data.layerIndex,
    latlng: [100, 200],
    position: { x: 20, y: 30 },
    feature: data.data
  });
};

describe('src/vis/infowindow-manager.js', function () {
  beforeEach(function () {
    this.map = new Map({}, {
      layersFactory: {}
    });

    this.infowindowModel = new InfowindowModel();
    this.tooltipModel = new TooltipModel();

    this.cartoDBLayerGroup = new CartoDBLayerGroup({}, {
      layersCollection: this.map.layers
    });

    this.layerView = new Backbone.View({
      model: this.cartoDBLayerGroup
    });

    spyOn(this.cartoDBLayerGroup, 'fetchAttributes').and.callFake(function (layerIndex, featureId, callback) {
      callback({ name: 'juan' });
    });

    this.vis = new VisModel();
    spyOn(this.vis, 'reload');

    this.infowindowManager = new InfowindowManager({ // eslint-disable-line
      visModel: this.vis,
      mapModel: this.map,
      infowindowModel: this.infowindowModel,
      tooltipModel: this.tooltipModel
    });
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

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1, layer2 ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    // A request to fetch the attributes for the right cartodb_id and layerIndex has been triggered
    expect(this.layerView.model.fetchAttributes.calls.count()).toEqual(1);
    expect(this.layerView.model.fetchAttributes).toHaveBeenCalledWith(0, 10, jasmine.any(Function));
    this.layerView.model.fetchAttributes.calls.reset();

    // InfowindowModel has been updated
    expect(this.infowindowModel.attributes).toEqual({
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
      'visibility': true,
      'currentFeatureId': 10
    });

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 1,
      data: { cartodb_id: 100 }
    });

    // A request to fetch the attributes for the right cartodb_id and layerIndex has been triggered
    expect(this.layerView.model.fetchAttributes.calls.count()).toEqual(1);
    expect(this.layerView.model.fetchAttributes).toHaveBeenCalledWith(1, 100, jasmine.any(Function));
    this.layerView.model.fetchAttributes.calls.reset();

    // InfowindowModel has been updated
    expect(this.infowindowModel.attributes).toEqual({
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
      'visibility': true,
      'currentFeatureId': 100
    });
  });

  it('should not fetch attributes and show the infowindow if template is empty', function () {
    var layer1 = createCartoDBLayer(this.vis, {
      template: '',
      template_type: 'underscore',
      fields: [{
        'name': 'name',
        'title': true,
        'position': 1
      }],
      alternative_names: 'alternative_names1'
    });

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.layerView.model.fetchAttributes).not.toHaveBeenCalled();
    expect(this.infowindowModel.get('visibility')).toEqual(false);
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

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);
    this.map.disablePopups();

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.layerView.model.fetchAttributes).not.toHaveBeenCalled();
    expect(this.infowindowModel.get('visibility')).toEqual(false);
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

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.infowindowModel.get('visibility')).toEqual(true);

    // Disable Map Popups
    this.map.disablePopups();

    expect(this.infowindowModel.get('visibility')).toEqual(false);
  });

  it('should set loading content while loading', function () {
    var layer1 = createCartoDBLayer(this.vis);

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);

    // Fetch attributes does NOT suceed inmediatily
    this.layerView.model.fetchAttributes.and.callFake(function () {});

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    // InfowindowModel has been updated
    expect(this.infowindowModel.get('content').fields).toEqual([
      {
        'type': 'loading',
        'title': 'loading',
        'value': '…'
      }
    ]);
    expect(this.infowindowModel.get('visibility')).toBe(true);
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

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1 ]);

    this.layerView.model.fetchAttributes.and.callFake(function (layerIndex, featureId, callback) {
      callback();
    });

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    // InfowindowModel has been updated
    expect(this.infowindowModel.get('content').fields).toEqual([
      {
        'title': null,
        'alternative_name': null,
        'value': 'There has been an error...',
        'index': null,
        'type': 'error'
      }
    ]);
    expect(this.infowindowModel.get('visibility')).toBe(true);
  });

  it('should set the currentFeatureId on the model when the infowindow is shown', function () {
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

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.infowindowModel.getCurrentFeatureId()).toEqual(10);
  });

  it('should hide the tooltip', function () {
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

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer ]);

    this.tooltipModel.set('visible', true);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.tooltipModel.isVisible()).toBeFalsy();
  });

  it('should unset the currentFeatureId on the model when the infowindow is hidden', function () {
    var layer = createCartoDBLayer(this.vis);

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    // Layer is hidden and infowindow too
    layer.hide();

    expect(this.infowindowModel.getCurrentFeatureId()).toBeUndefined();
  });

  it('should update the infowindow model when the infowindow template gets new fields', function () {
    var layer = createCartoDBLayer(this.vis);

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    spyOn(this.infowindowModel, 'setInfowindowTemplate');

    layer.infowindow.update({
      fields: [
        {
          'name': 'name',
          'title': true,
          'position': 1
        },
        {
          'name': 'description',
          'title': true,
          'position': 2
        }
      ]
    });

    expect(this.infowindowModel.setInfowindowTemplate).toHaveBeenCalledWith(layer.infowindow);
  });

  it('should re-fetch attributes when the vis is reloaded', function () {
    var layer = createCartoDBLayer(this.vis);
    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer ]);

    this.cartoDBLayerGroup.fetchAttributes.and.callFake(function (layerIndex, featureId, callback) {
      callback({ name: 'juan' });
    });

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.infowindowModel.get('content')).toEqual({
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
    });

    this.cartoDBLayerGroup.fetchAttributes.and.callFake(function (layerIndex, featureId, callback) {
      callback({ name: 'luis' });
    });

    this.vis.trigger('reloaded');

    // InfowindowModel has been updated
    expect(this.infowindowModel.get('content')).toEqual({
      'fields': [
        {
          'name': 'name',
          'title': 'name',
          'value': 'luis',
          'index': 0
        }
      ],
      'data': {
        'name': 'luis'
      }
    });
  });

  it('should hide the infowindow when fields are cleared in the infowindow template', function () {
    // Simulate that the layerView has been added a tooltipView
    var tooltipView = jasmine.createSpyObj('tooltipView', ['setFilter', 'hide']);
    tooltipView.setFilter.and.returnValue(tooltipView);
    this.layerView.tooltipView = tooltipView;

    var layer1 = createCartoDBLayer(this.vis);
    var layer2 = createCartoDBLayer(this.vis);

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1, layer2 ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.infowindowModel.get('visibility')).toBe(true);

    // Clear fields on layer #1
    layer2.infowindow.update({
      fields: []
    });

    // Nothing happened
    expect(this.infowindowModel.get('visibility')).toBe(true);
    expect(this.vis.reload).not.toHaveBeenCalledWith({});

    // Clear fields on layer #0 (the one that was opened)
    layer1.infowindow.update({
      fields: []
    });

    // Infowindow has been closed and map has NOT been reloaded
    expect(this.infowindowModel.get('visibility')).toBe(false);
    expect(this.vis.reload).not.toHaveBeenCalledWith({});
  });

  it('should hide the infowindow if the layer is hidden', function () {
    var layer1 = createCartoDBLayer(this.vis);
    var layer2 = createCartoDBLayer(this.vis);

    this.infowindowManager.start(this.layerView);

    this.map.layers.reset([ layer1, layer2 ]);

    simulateFeatureClickEvent(this.layerView, {
      layerIndex: 0,
      data: { cartodb_id: 10 }
    });

    expect(this.infowindowModel.get('visibility')).toBe(true);

    // hide layer2 -> nothing happens
    layer2.hide();

    expect(this.infowindowModel.get('visibility')).toBe(true);

    // hide layer1 -> infowindow is hidden
    layer1.hide();

    expect(this.infowindowModel.get('visibility')).toBe(false);
  });
});
