var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodeSourceModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AreaOfInfluenceFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({base_url: '/u/pepe'});
    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'buffer',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: configModel,
      collection: this.analysisDefinitionNodesCollection
    });
    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'buffer',
      radius: undefined,
      source: 'a0'
    }, {
      configModel: configModel,
      collection: this.analysisDefinitionNodesCollection
    });

    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: configModel
    });
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.callFake(function (id) {
      switch (id) {
        case 'a0': return this.a0;
        case 'a1': return this.a1;
        default: return null;
      }
    }.bind(this));
    this.model = new AreaOfInfluenceFormModel(this.a1.attributes, {
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

  it('should not have disabled types', function () {
    expect(this.model.schema.type.editorAttrs.disabled).toBe(false);
    expect(this.a0.isValidAsInputForType).toHaveBeenCalledWith('trade-area');
  });

  describe('when model is created with custom distance and radius', function () {
    beforeEach(function () {
      this.a1.set({
        radius: 2000,
        distance: 'kilometers'
      });

      this.model = new AreaOfInfluenceFormModel(this.a1.attributes, {
        layerDefinitionModel: this.layerDefinitionModel,
        analysisSourceOptionsModel: {},
        parse: true
      });
    });

    it('should convert the radius to the distance scale', function () {
      expect(this.model.get('radius')).toEqual(2);
      expect(this.model.get('distance')).toEqual('kilometers');
    });
  });

  describe('when source is not valid for other type', function () {
    beforeEach(function () {
      this.a0.isValidAsInputForType.and.returnValue(false);
      this.model = new AreaOfInfluenceFormModel(this.a1.attributes, {
        layerDefinitionModel: this.layerDefinitionModel,
        analysisSourceOptionsModel: {},
        parse: true
      });
    });

    it('should disable type since source is not valid input for the other type', function () {
      expect(this.model.schema.type.editorAttrs.disabled).toBe(true);
      expect(this.a0.isValidAsInputForType).toHaveBeenCalledWith('trade-area');
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
    it('should replace the attributes on the given node model but maintain values not visible/editable in the form', function () {
      this.model.save();
      expect(this.a1.attributes).toEqual({
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
      expect(this.a1.attributes).toEqual({
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
      expect(this.a1.get('radius')).toEqual(3000);
      expect(this.a1.get('distance')).toEqual('kilometers');
    });
  });
});
