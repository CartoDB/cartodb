var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodeSourceModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var GroupPointsFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model');
var analyses = require('../../../../../../../../javascripts/cartodb3/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/group-points-form-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus'
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'concave-hull',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: configModel,
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
    expect(this.model._formatAttrs(this.model.attributes)).toEqual({
      id: 'a1',
      source: 'a0',
      type: 'bounding-box'
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
      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'bounding-circle'
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
      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'convex-hull'
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
      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'concave-hull',
        target_percent: 0.7
      });
    });
  });
});
