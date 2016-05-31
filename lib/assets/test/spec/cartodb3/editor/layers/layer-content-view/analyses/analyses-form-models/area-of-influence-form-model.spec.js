var cdb = require('cartodb.js');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AreaOfInfluenceFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model', function () {
  beforeEach(function () {
    this.analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'a1',
      type: 'buffer',
      radius: undefined,
      source: 'a0'
    });
    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: {}
    });
    this.model = new AreaOfInfluenceFormModel(this.analysisDefinitionNodeModel.attributes, {
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: {},
      parse: true
    });
  });

  it('should add analysis schema', function () {
    expect(this.model.schema).toBeDefined();
  });

  it('should have attributes set with defaults', function () {
    expect(this.model.attributes).toEqual({
      id: 'a1',
      source: 'a0',
      type: 'buffer',
      distance: 'meters',
      radius: 100
    });
  });

  describe('when model is created with custom distance and radius', function () {
    beforeEach(function () {
      this.analysisDefinitionNodeModel.set({
        radius: 2000,
        distance: 'kilometers'
      });

      this.model = new AreaOfInfluenceFormModel(this.analysisDefinitionNodeModel.attributes, {
        layerDefinitionModel: {},
        analysisSourceOptionsModel: {},
        parse: true
      });
    });

    it('should convert the radius to the distance scale', function () {
      expect(this.model.get('radius')).toEqual(2);
      expect(this.model.get('distance')).toEqual('kilometers');
    });
  });

  describe('when type is changed', function () {
    beforeEach(function () {
      this.prevSchema = this.model.schema;
      this.model.set('type', 'trade-area');
    });

    it('should update the schema', function () {
      expect(this.model.schema).not.toBe(this.prevSchema);
    });

    it('should replace the attributes', function () {
      expect(this.model.attributes).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'trade-area',
        kind: 'walk',
        isolines: 1,
        time: 100,
        dissolved: false
      });
    });
  });

  describe('.getTemplate', function () {
    it('should return the template', function () {
      expect(this.model.getTemplate()).toEqual(jasmine.any(Function));
    });
  });

  describe('.getTemplateData', function () {
    it('should return the default data for given type', function () {
      var bufferTemplateData = this.model.getTemplateData();
      expect(bufferTemplateData).toEqual({
        parametersDataFields: jasmine.any(String)
      });

      this.model.set('type', 'trade-area');

      expect(this.model.getTemplateData()).toEqual({
        parametersDataFields: jasmine.any(String)
      });
      expect(this.model.getTemplateData().parametersDataFields).not.toEqual(bufferTemplateData.parametersDataFields);
    });
  });

  describe('.save', function () {
    beforeEach(function () {
      spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);
    });

    it('should replace the attributes on the given node model but maintain values not visible/editable in the form', function () {
      this.model.save();
      expect(this.analysisDefinitionNodeModel.attributes).toEqual({
        id: 'a1',
        type: 'buffer',
        source: 'a0',
        radius: 100,
        distance: 'meters'
      });
    });

    it('should convert string values to integers before setting the attrs on model', function () {
      this.model.set({
        type: 'trade-area',
        dissolved: 'true',
        isolines: '3',
        time: '60'
      });
      this.model.save();
      expect(this.analysisDefinitionNodeModel.attributes).toEqual({
        dissolved: true,
        isolines: 3,
        time: 60,
        type: 'trade-area',
        id: 'a1',
        source: 'a0',
        kind: 'walk'
      });
    });

    it('should convert radius to meters according to the selected distance', function () {
      this.model.set({
        distance: 'kilometers',
        radius: 3
      });

      this.model.save();
      expect(this.analysisDefinitionNodeModel.get('radius')).toEqual(3000);
      expect(this.analysisDefinitionNodeModel.get('distance')).toEqual('kilometers');
    });
  });
});
