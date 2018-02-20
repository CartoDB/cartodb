var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var GroupPointsFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus',
      user_name: 'pepe'
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'concave-hull',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: configModel,
      userModel: {},
      collection: this.analysisDefinitionNodesCollection
    });

    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'bounding-box',
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

    this.model = new GroupPointsFormModel(this.a1.attributes, {
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
      type: 'bounding-box',
      category_column: undefined,
      aggregate: Object({ operator: 'count', attribute: '' }),
      aggregation_column: '',
      aggregation: 'count'
    });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(4);
  });

  it('should bind properly', function () {
    this.model.set('aggregate', { operator: 'avg', attribute: 'wadus' });
    expect(this.model.get('aggregation_column')).toBe('wadus');
    expect(this.model.get('aggregation')).toBe('avg');
  });

  it('should have proper attributes', function () {
    expect(this.model._typeDef().parametersDataFields).toBe('source,type,category_column');
  });

  it('should format the attributes', function () {
    this.model.set('aggregate', { operator: 'avg', attribute: 'wadus' });

    expect(this.model._formatAttrs(this.model.attributes)).toEqual({
      id: 'a1',
      source: 'a0',
      type: 'bounding-box',
      aggregation: 'avg',
      aggregation_column: 'wadus'
    });
  });

  describe('type bounding-circle', function () {
    beforeEach(function () {
      this.model.set('type', 'bounding-circle');
    });

    it('should have proper attributes', function () {
      expect(this.model._typeDef().parametersDataFields).toBe('source,type,category_column');
    });

    it('should format the attributes', function () {
      this.model.set('category_column', 'cluster_no');
      this.model.set('aggregate', { operator: 'avg', attribute: 'wadus' });

      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'bounding-circle',
        category_column: 'cluster_no',
        aggregation: 'avg',
        aggregation_column: 'wadus'
      });
    });
  });

  describe('type convex-hull', function () {
    beforeEach(function () {
      this.model.set('type', 'convex-hull');
    });

    it('should have proper attributes', function () {
      expect(this.model._typeDef().parametersDataFields).toBe('source,type,category_column');
    });

    it('should format the attributes', function () {
      this.model.set('aggregate', { operator: 'sum', attribute: 'wadus' });

      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'convex-hull',
        aggregation: 'sum',
        aggregation_column: 'wadus'
      });
    });
  });

  describe('type concave-hull', function () {
    beforeEach(function () {
      this.model.set('type', 'concave-hull');
    });

    it('should have proper attributes', function () {
      expect(this.model._typeDef().parametersDataFields).toBe('source,type,target_percentage,allow_holes,category_column');
    });

    it('should format the attributes', function () {
      this.model.set('aggregate', { operator: 'sum', attribute: 'wadus' });

      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'concave-hull',
        target_percent: 0.7,
        aggregation: 'sum',
        aggregation_column: 'wadus'
      });
    });
  });
});
