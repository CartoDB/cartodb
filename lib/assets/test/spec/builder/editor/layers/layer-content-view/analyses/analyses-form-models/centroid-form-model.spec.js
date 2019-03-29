var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var CentroidFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/centroid-form-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus',
      user_name: 'pepe'
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'centroid',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: configModel,
      userModel: {},
      collection: this.analysisDefinitionNodesCollection
    });
    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'centroid',
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

    this.model = new CentroidFormModel(this.a1.attributes, {
      analyses: analyses,
      configModel: configModel,
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
      type: 'centroid',
      category: '',
      weight: '',
      aggregate: '',
      aggregation_column: '',
      aggregation: 'count'
    });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(4);
  });

  it('should bind properly', function () {
    this.model.set('category', 'wadus');
    expect(this.model.get('category_column')).toBe('wadus');
    this.model.set('category', '');
    expect(this.model.get('category_column')).not.toBeDefined();

    this.model.set('weight', 'wadus');
    expect(this.model.get('weight_column')).toBe('wadus');
    this.model.set('weight', '');
    expect(this.model.get('weight_column')).not.toBeDefined();

    this.model.set('aggregate', {operator: 'avg', attribute: 'wadus'});
    expect(this.model.get('aggregation_column')).toBe('wadus');
    expect(this.model.get('aggregation')).toBe('avg');
  });

  describe('type centroid', function () {
    beforeEach(function () {
      this.model.set('category', 'wadus');
    });

    it('should have type centroid', function () {
      expect(this.model.get('type')).toBe('centroid');
    });

    it('should not include weight_column', function () {
      expect(this.model.get('weight_column')).not.toBeDefined();
    });

    it('should have proper attributes', function () {
      expect(this.model.attributes).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'centroid',
        category: 'wadus',
        category_column: 'wadus',
        weight: '',
        aggregate: '',
        aggregation_column: '',
        aggregation: 'count'
      });
    });
  });

  describe('type weighted-centroid', function () {
    beforeEach(function () {
      this.model.set('weight', 'wadus');
    });

    it('should change type to weighted-centroid', function () {
      expect(this.model.get('type')).toBe('weighted-centroid');
    });

    it('should include weight_column', function () {
      expect(this.model.get('weight_column')).toBeDefined();
    });

    it('should have proper attributes', function () {
      expect(this.model.attributes).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'weighted-centroid',
        category: '',
        weight: 'wadus',
        weight_column: 'wadus',
        aggregate: '',
        aggregation_column: '',
        aggregation: 'count'
      });
    });
  });
});
