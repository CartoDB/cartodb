var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var DataObservatoryMeasureModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-measure-model');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-measure-model', function () {
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
      type: 'data-observatory-measure',
      final_column: 'my column!!!',
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

    this.model = new DataObservatoryMeasureModel(this.a1.attributes, {
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

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(5);
  });

  it('should format the attributes', function () {
    expect(this.model._formatAttrs(this.model.attributes)).toEqual({
      id: 'a1',
      source: 'a0',
      final_column: 'my_column',
      type: 'data-observatory-measure',
      segment_name: null
    });
  });
});
