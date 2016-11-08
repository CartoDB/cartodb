var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodeSourceModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var MergeFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/merge-form-model');
var AnalysisSourceOptionsModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var LayerDefinitionsCollection = require('../../../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var analyses = require('../../../../../../../../javascripts/cartodb3/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/merge-form-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus',
      user_name: 'pepe'
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'merge',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: configModel,
      collection: this.analysisDefinitionNodesCollection
    });

    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'merge',
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
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123'
    });

    this.analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      tablesCollection: new Backbone.Collection()
    });

    this.analysisSourceOptionsModel.getSelectOptions = function () {
      return this;
    };

    this.analysisSourceOptionsModel.find = function () {
      return this;
    };

    this.analysisSourceOptionsModel.filter = function () {
      return [];
    };

    this.model = new MergeFormModel(this.a1.attributes, {
      analyses: analyses,
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
      type: 'merge',
      source_geometry_selector: undefined,
      join_operator: 'inner',
      source_geometry: 'left_source',
      right_source_columns: []
    });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(8);
  });

  it('should format the attributes', function () {
    expect(this.model._formatAttrs(this.model.attributes)).toEqual({
      id: 'a1',
      type: 'merge',
      join_operator: 'inner',
      source_geometry_selector: undefined,
      right_source_columns: [],
      source_geometry: 'left_source',
      left_source_columns: [],
      left_source: '',
      right_source: '',
      left_source_column: null,
      right_source_column: null
    });
  });

  describe('parsing the model', function () {
    it('should parse the model with right source_geometry', function () {
      var attrs = {
        id: 'a1',
        source: 'a0',
        type: 'merge',
        source_geometry: 'right_source',
        right_source: 'right'
      };

      expect(this.model.parse(attrs)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'merge',
        right_source: 'right',
        source_geometry_selector: 'right',
        source_geometry: 'right_source'
      });
    });

    it('should parse the model without source_geometry', function () {
      var attrs = {
        id: 'a1',
        source: 'a0',
        type: 'merge',
        source_geometry: null,
        left_source: 'left'
      };

      expect(this.model.parse(attrs)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'merge',
        left_source: 'left',
        source_geometry: null,
        source_geometry_selector: 'left'
      });
    });
  });
});
