var Backbone = require('backbone');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var BaseTiledLayerView = require('builder/editor/layers/layer-views/base-tiled-layer-view');
var PlainColorLayerView = require('builder/editor/layers/layer-views/plain-color-layer-view');
var BackgroundImageLayerView = require('builder/editor/layers/layer-views/background-image-layer-view');
var DataLayerView = require('builder/editor/layers/layer-views/data-layer-view');
var ErroredDataLayerView = require('builder/editor/layers/layer-views/errored-data-layer-view');
var LabelsLayerView = require('builder/editor/layers/layer-views/labels-layer-view');
var LayerViewFactory = require('builder/editor/layers/layer-view-factory');
var ModalsService = require('builder/components/modals/modals-service-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');

describe('builder/editor/layers/layer-view-factory', function () {
  beforeEach(function () {
    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a2',
      type: 'buffer',
      params: {}
    }, {
      configModel: {}
    });

    spyOn(this.nodeDefModel.querySchemaModel, 'fetch');
    spyOn(this.nodeDefModel.queryGeometryModel, 'fetch');
    spyOn(this.nodeDefModel.queryRowsCollection, 'fetch');

    this.layerViewFactory = new LayerViewFactory({
      modals: new ModalsService(),
      userActions: {},
      stackLayoutModel: {},
      layerDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      analysis: {},
      configModel: {},
      sortableSelector: '.selector',
      stateDefinitionModel: {},
      visDefinitionModel: {},
      widgetDefinitionsCollection: new Backbone.Collection()
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

  describe('data-layer-view', function () {
    var layerModel;
    beforeEach(function () {
      layerModel = new LayerDefinitionModel({
        type: 'CartoDB',
        order: 1
      }, {
        configModel: {}
      });
      spyOn(layerModel, 'findAnalysisDefinitionNodeModel');
    });

    it('should return an instance of DataLayerView', function () {
      layerModel.findAnalysisDefinitionNodeModel.and.returnValue(this.nodeDefModel);
      var layerView = this.layerViewFactory.createLayerView(layerModel);
      expect(layerView instanceof DataLayerView).toBe(true);
    });

    it('should return an instance of ErrorDataLayerView', function () {
      layerModel.findAnalysisDefinitionNodeModel.and.returnValue(null);
      var layerView = this.layerViewFactory.createLayerView(layerModel);
      expect(layerView instanceof ErroredDataLayerView).toBe(true);
    });
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
