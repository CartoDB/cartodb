var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../../javascripts/cartodb3/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var ConnectWithLinesFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model');
var LayerDefinitionsCollection = require('../../../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisSourceOptionsModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var analyses = require('../../../../../../../../javascripts/cartodb3/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/connect-with-lines-form-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus',
      user_name: 'pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'line-to-column',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: configModel,
      collection: this.analysisDefinitionNodesCollection
    });

    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'line-sequential',
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

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });

    this.analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      tablesCollection: new Backbone.Collection()
    });

    this.model = new ConnectWithLinesFormModel(this.a1.attributes, {
      analyses: analyses,
      userModel: {},
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel,
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
      type: 'line-sequential',
      order_column: undefined,
      category_column: undefined,
      order_type: 'asc',
      closest: true
    });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(5);
  });

  it('should have proper attributes', function () {
    expect(this.model._typeDef().parametersDataFields).toBe('source,type,order_column,order_type');
    expect(this.model._typeDef().parametersDataSchema).toBe('order_column,order_type,category_column');
  });

  it('should format the attributes', function () {
    expect(this.model._formatAttrs(this.model.attributes)).toEqual({
      id: 'a1',
      source: 'a0',
      type: 'line-sequential',
      order_type: 'asc',
      order_column: null,
      closest: true
    });
  });

  describe('type line-source-to-target', function () {
    beforeEach(function () {
      this.model.set('type', 'line-source-to-target');
    });

    it('should have proper attributes', function () {
      expect(this.model._typeDef().parametersDataFields).toBe('source,type,target,closest');
      expect(this.model._typeDef().parametersDataSchema).toBe('target,closest,group,source_column,target_source_column');
    });

    it('should format the attributes', function () {
      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'line-source-to-target',
        target: '',
        closest: true,
        order_type: 'asc'
      });
    });
  });

  describe('type line-to-single-point', function () {
    beforeEach(function () {
      this.model.set('type', 'line-to-single-point');
    });

    it('should have proper attributes', function () {
      expect(this.model._typeDef().parametersDataFields).toBe('source,type,destination_longitude,destination_latitude');
      expect(this.model._typeDef().parametersDataSchema).toBe('destination_longitude,destination_latitude');
    });

    it('should format the attributes', function () {
      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'line-to-single-point',
        destination_longitude: NaN,
        destination_latitude: NaN,
        closest: true,
        order_type: 'asc'
      });
    });
  });

  describe('type line-to-column', function () {
    beforeEach(function () {
      this.model.set('type', 'line-to-column');
    });

    it('should have proper attributes', function () {
      expect(this.model._typeDef().parametersDataFields).toBe('source,type,target_column');
      expect(this.model._typeDef().parametersDataSchema).toBe('target_column');
    });

    it('should format the attributes', function () {
      expect(this.model._formatAttrs(this.model.attributes)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'line-to-column',
        target_column: null,
        closest: true,
        order_type: 'asc'
      });
    });
  });
});
