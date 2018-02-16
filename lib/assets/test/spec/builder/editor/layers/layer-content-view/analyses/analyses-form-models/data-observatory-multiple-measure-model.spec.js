var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var DataObservatoryMeasureModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-multiple-measure-model');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/data-observatory-multiple-measure-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus',
      user_name: 'pepe'
    });

    this.querySchemaModel = new Backbone.Model({
      query: 'select * from wadus'
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'data-observatory-multiple-measures',
      area: 'calafornia',
      numerators: ['foo', 'bar'],
      column_names: ['final_column', 'otra'],
      denominators: [null, null],
      numerator_timespans: [null, null],
      geom_ids: ['wadus', null],
      normalizations: ['area', 'area'],
      source: 'a0'
    }, {
      configModel: configModel,
      collection: this.analysisDefinitionNodesCollection
    });

    this.a0.querySchemaModel = this.querySchemaModel;
    this.a0.queryGeometryModel = new Backbone.Model();
    this.a0.queryGeometryModel.isFetched = function () { return true; };

    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: configModel
    });

    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue(this.a0);

    this.model = new DataObservatoryMeasureModel(this.a0.attributes, {
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

  it('filter Global region', function () {
    spyOn(this.model.regions.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [
          {
            num_measurements: 2,
            region_id: 'section/tags.global',
            region_name: '"Global"'
          }, {
            num_measurements: 634,
            region_id: 'section/tags.united_states',
            region_name: '"United States"'
          }
        ]
      });
    });

    this.model.regions.fetch();
    expect(this.model.regions.length).toBe(2);

    var options = this.model._getRegionOptions();
    expect(options.length).toBe(1);
    expect(options[0].get('label')).toBe('United States');
  });

  it('should generate schema properly', function () {
    expect(Object.keys(this.model.schema).length).toBe(3);
    expect(this.model.schema.measurements).toBeDefined();
  });

  it('should generate measurements fields properly when region is selected', function () {
    this.model.set('area', null);
    var fields = this.model.getTemplateData().fields;
    expect(fields).toBe('');

    this.model.set('area', 'wadus');
    fields = this.model.getTemplateData().fields;
    expect(fields).toBe('measurements');
  });

  it('should format the attributes', function () {
    expect(this.model._formatAttrs(this.model.attributes)).toEqual({
      id: 'a1',
      type: 'data-observatory-multiple-measures',
      source: 'a0',
      area: 'calafornia',
      numerators: ['foo', 'bar'],
      column_names: ['final_column', 'otra'],
      denominators: [null, null],
      normalizations: ['area', 'area'],
      numerator_timespans: [null, null],
      geom_ids: ['wadus', null]
    });
  });

  describe('validate', function () {
    it('no values should not return error', function () {
      spyOn(this.model, '_getNumerators').and.returnValue([]);
      spyOn(this.model, '_getColumnNames').and.returnValue([]);
      expect(this.model.validate()).toBeUndefined();
    });

    it('empty values should return error', function () {
      spyOn(this.model, '_getNumerators').and.returnValue(['']);
      spyOn(this.model, '_getColumnNames').and.returnValue(['']);
      expect(this.model.validate()).not.toBeUndefined();
    });

    it('mismatch length should return error', function () {
      spyOn(this.model, '_getNumerators').and.returnValue(['foo', 'bar']);
      spyOn(this.model, '_getColumnNames').and.returnValue(['wadus']);
      expect(this.model.validate()).not.toBeUndefined();
    });

    it('right values should not return error', function () {
      spyOn(this.model, '_getNumerators').and.returnValue(['foo']);
      spyOn(this.model, '_getColumnNames').and.returnValue(['wadus']);
      expect(this.model.validate()).toBeUndefined();
    });
  });
});
