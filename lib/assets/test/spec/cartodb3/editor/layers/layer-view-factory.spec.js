var Backbone = require('backbone');
var BaseTiledLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/base-tiled-layer-view');
var PlainColorLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/plain-color-layer-view');
var BackgroundImageLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/background-image-layer-view');
var DataLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/data-layer-view');
var LabelsLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/labels-layer-view');
var LayerViewFactory = require('../../../../../javascripts/cartodb3/editor/layers/layer-view-factory');

describe('cartodb3/editor/layers/layer-view-factory.js', function () {
  beforeEach(function () {
    this.layerViewFactory = new LayerViewFactory({
      stackLayoutModel: {},
      layerDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      analysis: {},
      sortableSelector: '.selector'
    });
  });

  it('should return an instance of BaseTiledLayerView', function () {
    var layerModel = new Backbone.Model({
      type: 'Tiled',
      order: 0
    });
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof BaseTiledLayerView).toBe(true);
  });

  it('should return an instance of PlainColorLayerView', function () {
    var layerModel = new Backbone.Model({
      type: 'Plain',
      order: 0,
      color: '#FABADA'
    });
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof PlainColorLayerView).toBe(true);
  });

  it('should return an instance of BackgroundImageLayerView', function () {
    var layerModel = new Backbone.Model({
      type: 'Plain',
      order: 0,
      image: 'http://example.com/image.png'
    });
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof BackgroundImageLayerView).toBe(true);
  });

  it('should return an instance of DataLayerView', function () {
    var layerModel = new Backbone.Model({
      type: 'CartoDB',
      order: 1
    });
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof DataLayerView).toBe(true);
  });

  it('should return an instance of DataLayerView', function () {
    var layerModel = new Backbone.Model({
      type: 'torque',
      order: 1
    });
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof DataLayerView).toBe(true);
  });

  it('should return an instance of LabelsLayerView', function () {
    var layerModel = new Backbone.Model({
      type: 'Tiled',
      order: 3
    });
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof LabelsLayerView).toBe(true);
  });
});
