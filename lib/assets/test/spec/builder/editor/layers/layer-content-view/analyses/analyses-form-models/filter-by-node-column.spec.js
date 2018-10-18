var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var FilterFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/filter-by-node-column');
var AnalysisSourceOptionsModel = require('builder/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/filter-by-node-column', function () {
  var createModelFn = function (attributes, options) {
    var defaultOptions = {
      analyses: analyses,
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    };

    this.model = new FilterFormModel(_.extend({}, this.a1.attributes, attributes), _.extend({}, defaultOptions, options));
  };

  beforeEach(function () {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
      .andReturn({ status: 200 });

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
      type: 'filter-by-node-column',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: this.configModel,
      userModel: {},
      collection: this.analysisDefinitionNodesCollection
    });

    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'filter-by-node-column',
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

  afterEach(function () {
    jasmine.Ajax.uninstall();
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
      type: 'filter-by-node-column'
    });
  });

  it('should have generated form fields', function () {
    this.createModel();

    expect(Object.keys(this.model.schema).length).toBe(4);
  });

  describe('template', function () {
    beforeEach(function () {
      this.createModel();
    });

    describe('should return proper return template data', function () {
      it('when no filter source', function () {
        this.model.set('filter_source', undefined);

        expect(this.model.getTemplateData()).toEqual({
          hasFilterSource: false
        });
      });

      it('when something as filter_source', function () {
        this.model.set('filter_source', 'shiva');

        expect(this.model.getTemplateData()).toEqual({
          hasFilterSource: true
        });
      });
    });

    it('should disable the second step if not source column', function () {
      var template = this.model.getTemplate()({
        hasFilterSource: false,
        linkContent: ''
      });

      expect(template.indexOf('Editor-HeaderInfo is-disabled')).not.toBe(-1);
    });

    it('should enable the second step if not source column', function () {
      var template = this.model.getTemplate()({
        hasFilterSource: true,
        linkContent: ''
      });

      expect(template.indexOf('Editor-HeaderInfo is-disabled')).toBe(-1);
    });
  });

  describe('type filter by node column', function () {
    beforeEach(function () {
      this.createModel({
        filter_source: 'a0',
        column: null,
        filter_column: null
      });
    });

    it('should have proper attributes', function () {
      expect(this.model.attributes).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'filter-by-node-column',
        filter_source: 'a0',
        column: null,
        filter_column: null
      });
    });

    describe('filter_column', function () {
      it('validator is correct', function () {
        this.model.set('column', 'cartodb_id');

        expect(this.model.schema.column).toBeDefined();

        this.model.set('filter_column', 'numero_de_finca');

        expect(this.model.schema.filter_column).toBeDefined();
        expect(this.model.schema.filter_column.validators).toBeDefined();
        expect(this.model.schema.filter_column.validators[0]).toEqual('required');
        expect(this.model.schema.filter_column.validators[1]).toEqual(jasmine.any(Function));
      });
    });

    describe('._validateFilterColumn', function () {
      it('should validate column types match', function () {
        var formValues = {
          column: 'cartodb_id',
          filter_column: 'numero_de_finca'
        };

        spyOn(this.model._columnOptions, 'findColumn').and.returnValue({
          type: 'number'
        });
        spyOn(this.model._filterColumnOptions, 'findColumn').and.returnValue({
          type: 'string'
        });

        expect(JSON.stringify(this.model._validateFilterColumn('numero_de_finca', formValues)))
          .toBe('{"message":"editor.layers.analysis-form.should-match"}');
      });
    });
  });
});
