var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var BaseTiledLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/base-tiled-layer-view');
var PlainColorLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/plain-color-layer-view');
var BackgroundImageLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/background-image-layer-view');
var DataLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/data-layer-view');
var LabelsLayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-views/labels-layer-view');
var LayerViewFactory = require('../../../../../javascripts/cartodb3/editor/layers/layer-view-factory');
var ModalsService = require('../../../../../javascripts/cartodb3/components/modals/modals-service-model');
var AnalysisDefinitionNodeModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('cartodb3/editor/layers/layer-view-factory.js', function () {
  beforeEach(function () {
    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a2',
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });

    this.layerViewFactory = new LayerViewFactory({
      modals: new ModalsService(),
      userActions: {},
      stackLayoutModel: {},
      layerDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      analysis: {},
      configModel: {},
      sortableSelector: '.selector'
    });
  });

  it('should return an instance of BaseTiledLayerView', function () {
    var layerModel = new LayerDefinitionModel({
      type: 'Tiled',
      order: 0
    }, {
      configModel: {}
    });
    spyOn(layerModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof BaseTiledLayerView).toBe(true);
  });

  it('should return an instance of PlainColorLayerView', function () {
    var layerModel = new LayerDefinitionModel({
      type: 'Plain',
      order: 0,
      color: '#FABADA'
    }, {
      configModel: {}
    });
    spyOn(layerModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof PlainColorLayerView).toBe(true);
  });

  it('should return an instance of BackgroundImageLayerView', function () {
    var layerModel = new LayerDefinitionModel({
      type: 'Plain',
      order: 0,
      image: 'http://example.com/image.png'
    }, {
      configModel: {}
    });
    spyOn(layerModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof BackgroundImageLayerView).toBe(true);
  });

  it('should return an instance of DataLayerView', function () {
    var layerModel = new LayerDefinitionModel({
      type: 'CartoDB',
      order: 1
    }, {
      configModel: {}
    });
    spyOn(layerModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof DataLayerView).toBe(true);
  });

  it('should return an instance of DataLayerView', function () {
    var layerModel = new LayerDefinitionModel({
      type: 'torque',
      order: 1
    }, {
      configModel: {}
    });
    spyOn(layerModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof DataLayerView).toBe(true);
  });

  it('should return an instance of LabelsLayerView', function () {
    var layerModel = new LayerDefinitionModel({
      type: 'Tiled',
      order: 3
    }, {
      configModel: {}
    });
    spyOn(layerModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);
    var layerView = this.layerViewFactory.createLayerView(layerModel);
    expect(layerView instanceof LabelsLayerView).toBe(true);
  });
});
