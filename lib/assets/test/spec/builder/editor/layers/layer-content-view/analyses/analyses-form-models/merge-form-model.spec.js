var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var MergeFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/merge-form-model');
var AnalysisSourceOptionsModel = require('builder/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/merge-form-model', function () {
  var createModelFn = function (attributes, options) {
    var defaultOptions = {
      analyses: analyses,
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel,
      parse: true
    };

    this.model = new MergeFormModel(_.extend({}, this.a1.attributes, attributes), _.extend({}, defaultOptions, options));
  };

  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus',
      user_name: 'pepe'
    });

    var userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'merge',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: this.configModel,
      userModel: {},
      collection: this.analysisDefinitionNodesCollection
    });

    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'merge',
      source: 'a0'
    }, {
      configModel: this.configModel,
      collection: this.analysisDefinitionNodesCollection
    });

    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: this.configModel
    });

    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.callFake(function (id) {
      switch (id) {
        case 'a0': return this.a0;
        case 'a1': return this.a1;
        default: return null;
      }
    }.bind(this));

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: {}
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

    this.createModel = createModelFn.bind(this);
  });

  it('should add analysis schema', function () {
    this.createModel();

    expect(this.model.schema).toBeDefined();
  });

  it('should have attributes set with defaults', function () {
    this.createModel();

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
    this.createModel();

    expect(Object.keys(this.model.schema).length).toBe(8);
  });

  it('should disable the fields appropriately', function () {
    this.createModel();

    var template = this.model.getTemplate()({
      linkContent: '',
      right_source: true,
      hasLeftAndRightSourceColumns: true
    });

    expect((template.match(/Editor-HeaderInfo is-disabled/g) || []).length).toBe(0);

    template = this.model.getTemplate()({
      linkContent: '',
      right_source: true,
      hasLeftAndRightSourceColumns: false
    });

    expect((template.match(/Editor-HeaderInfo is-disabled/g) || []).length).toBe(1);

    template = this.model.getTemplate()({
      linkContent: '',
      right_source: false,
      hasLeftAndRightSourceColumns: false
    });

    expect((template.match(/Editor-HeaderInfo is-disabled/g) || []).length).toBe(2);
  });

  it('should format the attributes', function () {
    this.createModel();

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
    beforeEach(function () {
      this.createModel();
    });

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

  describe('type join columns', function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
        .andReturn({ status: 200 });

      this.createModel({
        left_source: 'a0',
        right_source: 'a0',
        left_source_column: null,
        right_source_column: null
      }, {
        analyses: analyses,
        configModel: this.configModel,
        layerDefinitionModel: this.layerDefinitionModel,
        analysisSourceOptionsModel: this.analysisSourceOptionsModel,
        parse: true
      });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should include left_source and right_source column', function () {
      expect(this.model.get('left_source_column')).toBeDefined();
      expect(this.model.get('right_source_column')).toBeDefined();
    });

    it('should have proper attributes', function () {
      expect(this.model.attributes).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'merge',
        source_geometry_selector: 'a0',
        join_operator: 'inner',
        source_geometry: 'left_source',
        right_source_columns: [],
        left_source_column: null,
        right_source_column: null,
        left_source: 'a0',
        right_source: 'a0'
      });
    });

    it('should have generated form fields', function () {
      expect(Object.keys(this.model.schema).length).toBe(8);

      expect(this.model.schema.left_source_column).toBeDefined();
      expect(this.model.schema.right_source_column).toBeDefined();
    });

    describe('right_source_column', function () {
      it('validator is correct', function () {
        this.model.set('left_source_column', 'cartodb_id');

        expect(this.model.schema.left_source_column).toBeDefined();
        expect(this.model.schema.left_source_column.validators).toBeDefined();
        expect(this.model.schema.left_source_column.validators[0]).toEqual('required');

        this.model.set('right_source_column', 'numero_de_finca');

        expect(this.model.schema.right_source_column).toBeDefined();
        expect(this.model.schema.right_source_column.validators).toBeDefined();
        expect(this.model.schema.right_source_column.validators[0]).toEqual('required');
        expect(this.model.schema.right_source_column.validators[1]).toEqual(jasmine.any(Function));
      });
    });

    describe('._validateRightSourceColumn', function () {
      it('should validate column types match', function () {
        var self = this;

        var formValues = {
          join_operator: 'inner',
          left_source_column: 'cartodb_id',
          right_source_column: 'numero_de_finca'
        };

        spyOn(this.model._leftColumnOptions, 'findColumn').and.returnValue({
          type: 'number'
        });
        spyOn(this.model._rightColumnOptions, 'findColumn').and.returnValue({
          type: 'string'
        });

        expect(JSON.stringify(self.model._validateRightSourceColumn('numero_de_finca', formValues)))
          .toBe('{"message":"editor.layers.analysis-form.should-match"}');
      });
    });
  });
});
