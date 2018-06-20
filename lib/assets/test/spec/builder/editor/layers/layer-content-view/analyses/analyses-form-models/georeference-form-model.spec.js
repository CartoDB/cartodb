var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var analyses = require('builder/data/analyses');
var GeoreferenceFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/georeference-form-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      api_key: 'wadus',
      user_name: 'pepe'
    });

    this.analysisDefinitionNodesCollection = new Backbone.Collection();

    this.a0 = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM a_table'
    }, {
      configModel: configModel,
      userModel: {},
      collection: this.analysisDefinitionNodesCollection
    });
    spyOn(this.a0, 'isValidAsInputForType').and.returnValue(true);

    this.a1 = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'georeference-long-lat',
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

    this.model = new GeoreferenceFormModel(this.a1.attributes, {
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
      type: 'georeference-long-lat',
      latitude: undefined,
      longitude: undefined
    });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(4);
  });

  describe('type georeference-street-address', function () {
    beforeEach(function () {
      this.model.set('type', 'georeference-street-address');
    });

    it('should have proper attributes', function () {
      expect(this.model.attributes).toEqual({
        context: undefined,
        id: 'a1',
        source: 'a0',
        type: 'georeference-street-address',
        street_address_column: '',
        city: '',
        state: '',
        country: ''
      });
    });

    it('should have generated form fields', function () {
      expect(Object.keys(this.model.schema).length).toBe(7);

      expect(this.model.schema.street_address_column).toBeDefined();
    });

    describe('context advance', function () {
      it('should have generated form fields', function () {
        this.model.set('context', 'advance');

        expect(Object.keys(this.model.schema).length).toBe(7);
        expect(this.model.schema.street_address_column).not.toBeDefined();
        expect(this.model.schema.street_address_template).toBeDefined();
      });

      it('should format street_address properly', function () {
        spyOn(this.model._typeDef(), '_wrapInBraces').and.callThrough();

        this.model.set('street_address_column', 'address');
        this.model.set('context', 'advance');

        expect(this.model._typeDef()._wrapInBraces).toHaveBeenCalledWith('address');
        expect(this.model.get('street_address_template')).toBe('{{address}}');
      });
    });
  });

  describe('type georeference-postal-code-model', function () {
    beforeEach(function () {
      this.model.set('type', 'georeference-postal-code');
    });

    it('should have proper attributes', function () {
      expect(this.model.attributes).toEqual({
        context: undefined,
        id: 'a1',
        source: 'a0',
        type: 'georeference-postal-code',
        postal_code_column: '',
        postal_code_country: ''
      });
    });

    it('should have generated form fields', function () {
      expect(Object.keys(this.model.schema).length).toBe(4);

      expect(this.model.schema.postal_code_column).toBeDefined();
      expect(this.model.schema.postal_code_column.validators[0]).toBe('required');
      expect(this.model.schema.postal_code_country).toBeDefined();
      expect(this.model.schema.postal_code_country.validators[0]).toBe('required');
    });
  });

  it('should return only numeric columns for latitude and longitude', function () {
    this.model._columnOptions._columnOptions = {
      cartodb_id: { type: 'number' },
      title: { type: 'string' },
      created_at: { type: 'date' }
    };
    this.model._setSchema();

    expect(this.model.schema.latitude.options.length).toBe(1);
    expect(this.model.schema.longitude.options.length).toBe(1);
  });
});
