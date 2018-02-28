var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var AreaOfInfluenceFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form-model', function () {
  beforeEach(function () {
    this._configModel = new ConfigModel({base_url: '/u/pepe'});
    this._configModel.dataServiceEnabled = function () {
      return true;
    };

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'buffer',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: this._configModel,
      userModel: {},
      collection: this.analysisDefinitionNodesCollection
    });
    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'buffer',
      radius: undefined,
      source: 'a0'
    }, {
      configModel: this._configModel,
      userModel: {},
      collection: this.analysisDefinitionNodesCollection
    });

    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: this._configModel
    });
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.callFake(function (id) {
      switch (id) {
        case 'a0': return this.a0;
        case 'a1': return this.a1;
        default: return null;
      }
    }.bind(this));
    this.model = new AreaOfInfluenceFormModel(this.a1.attributes, {
      analyses: analyses,
      configModel: this._configModel,
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
      radius: 100,
      isolines: 1,
      dissolved: false
    });
  });

  it('should not have disabled types', function () {
    spyOn(this.model._analyses, 'isAnalysisValidByType').and.returnValue(true);
    this.model._setSchema();
    var typeOptions = this.model.schema.type.options.map(function (d) {
      return _.pick(d, 'val', 'disabled');
    });
    expect(typeOptions).toEqual([
      {val: 'buffer', disabled: false},
      {val: 'trade-area', disabled: false}
    ]);
    expect(this.a0.isValidAsInputForType).toHaveBeenCalledWith('trade-area');
  });

  describe('when model is created with custom distance and radius', function () {
    beforeEach(function () {
      this.a1.set({
        radius: 2000,
        distance: 'kilometers'
      });

      this.model = new AreaOfInfluenceFormModel(this.a1.attributes, {
        analyses: analyses,
        configModel: this._configModel,
        userActions: {},
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
        analyses: analyses,
        configModel: this._configModel,
        userActions: {},
        layerDefinitionModel: this.layerDefinitionModel,
        analysisSourceOptionsModel: {},
        parse: true
      });
    });

    it('should disable type since source is not valid input for the other type', function () {
      var typeOptions = this.model.schema.type.options.map(function (d) {
        return _.pick(d, 'val', 'disabled');
      });
      expect(typeOptions).toEqual([
        {val: 'buffer', disabled: false},
        {val: 'trade-area', disabled: true}
      ]);
      expect(this.a0.isValidAsInputForType).toHaveBeenCalledWith('trade-area');
    });
  });

  describe('when type is changed', function () {
    describe('for a new model', function () {
      beforeEach(function () {
        this.prevSchema = this.model.schema;
        this.model.set('type', 'trade-area');
      });

      it('should update the schema', function () {
        expect(this.model.schema).not.toBe(this.prevSchema);
      });

      it('should replace the attributes but maintain persisted state', function () {
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

    describe('for an persisted model', function () {
      beforeEach(function () {
        this.prevSchema = this.model.schema;
        this.model.set('persisted', true);
        this.model.set('type', 'trade-area');
      });

      it('should update the schema', function () {
        expect(this.model.schema).not.toBe(this.prevSchema);
      });

      it('should replace the attributes but maintain persisted state', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'trade-area',
          kind: 'walk',
          isolines: 1,
          time: 100,
          dissolved: false,
          persisted: true
        });
      });

      it('should have proper attributes', function () {
        expect(this.model._typeDef().parametersDataFields).toBe('type,kind,time,isolines,dissolved');
      });
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

  describe('.updateNodeDefinition', function () {
    beforeEach(function () {
      this.model.updateNodeDefinition(this.a1);
    });

    it('should replace the attributes on the given node model but maintain values not visible/editable in the form', function () {
      expect(this.a1.attributes).toEqual({
        id: 'a1',
        type: 'buffer',
        source: 'a0',
        radius: 100,
        isolines: 1,
        distance: 'meters',
        dissolved: false
      });
    });

    it('should convert string values to integers before setting the attrs on model', function () {
      this.model.set({
        type: 'trade-area',
        dissolved: 'true',
        isolines: '3',
        time: '60'
      });

      this.model.updateNodeDefinition(this.a1);
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

    it('should have proper attributes', function () {
      expect(this.model._typeDef().parametersDataFields).toBe('type,distance,radius,isolines,dissolved');
    });

    it('should convert radius to meters according to the selected distance', function () {
      this.model.set({
        distance: 'kilometers',
        radius: 3
      });

      this.model.updateNodeDefinition(this.a1);
      expect(this.a1.get('radius')).toEqual(3000);
      expect(this.a1.get('distance')).toEqual('kilometers');
    });
  });
});
