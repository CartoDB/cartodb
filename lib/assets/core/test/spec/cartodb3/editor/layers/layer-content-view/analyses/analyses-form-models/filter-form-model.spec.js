var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var analyses = require('../../../../../../../../javascripts/cartodb3/data/analyses');
var FilterFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model');
var AnalysisDefinitionNodeSourceModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AnalysisDefinitionNodeModel = require('../../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
      .andReturn({ status: 200 });

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
      type: 'filter-range',
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

    this.model = new FilterFormModel(this.a1.attributes, {
      analyses: analyses,
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: {},
      parse: true
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should add analysis schema', function () {
    expect(this.model.schema).toBeDefined();
  });

  it('should have attributes set with defaults', function () {
    expect(this.model.attributes).toEqual({
      id: 'a1',
      source: 'a0',
      type: 'filter-range',
      kind: 'between',
      min: 0,
      max: 50,
      column: '',
      accept_reject: 'accept'
    });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(5);

    expect(this.model.schema.min).toBeDefined();
    expect(this.model.schema.max).toBeDefined();
  });

  describe('number', function () {
    beforeEach(function () {
      spyOn(this.model, '_getSelectedColumnType').and.returnValue('number');

      this.model.set('column', 'number');
    });

    describe('kind is-equal-to', function () {
      beforeEach(function () {
        this.model.set('kind', 'is-equal-to');
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-equal-to',
          min: 0,
          max: 50
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.text).toBeDefined();
        expect(this.model.schema.min).not.toBeDefined();
        expect(this.model.schema.max).not.toBeDefined();
      });
    });

    describe('kind is-less-than', function () {
      beforeEach(function () {
        this.model.set('kind', 'is-less-than');
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-less-than',
          min: 0,
          max: 50
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.max).toBeDefined();
        expect(this.model.schema.text).not.toBeDefined();
        expect(this.model.schema.min).not.toBeDefined();
      });
    });

    describe('kind is-greater-than', function () {
      beforeEach(function () {
        this.model.set('kind', 'is-greater-than');
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-greater-than',
          min: 0,
          max: 50
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.min).toBeDefined();
        expect(this.model.schema.max).not.toBeDefined();
        expect(this.model.schema.text).not.toBeDefined();
      });
    });
  });

  describe('string', function () {
    beforeEach(function () {
      spyOn(this.model, '_getSelectedColumnType').and.returnValue('string');

      this.model.set('column', 'string');
    });

    it('should not include default attributes', function () {
      expect(this.model.get('kind')).toBe(null);
    });

    it('should have proper attributes', function () {
      expect(this.model.attributes).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'filter-category',
        accept_reject: 'accept',
        column: 'string',
        kind: null,
        min: 0,
        max: 50
      });
    });

    it('should have generated form fields', function () {
      expect(Object.keys(this.model.schema).length).toBe(4);

      expect(this.model.schema.text).toBeDefined();
      expect(this.model.schema.accept_reject).toBeDefined();
    });

    describe('.updateNodeDefinition', function () {
      beforeEach(function () {
        this.model.updateNodeDefinition(this.a1);
      });

      it('should replace the attributes on the given node model but maintain values not visible/editable in the form', function () {
        expect(this.a1.attributes).toEqual({
          id: 'a1',
          type: 'filter-category',
          source: 'a0',
          column: 'string'
        });
      });

      it('should convert string values to integers before setting the attrs on model', function () {
        this.model.set({
          accept_reject: 'reject'
        });

        this.model.updateNodeDefinition(this.a1);

        expect(this.a1.attributes).toEqual({
          dissolved: true,
          isolines: 3,
          time: 60,
          type: 'trade-area',
          id: 'a1',
          source: 'a0',
          kind: 'walk'
        });
      });
    });
  });

  describe('boolean', function () {
    beforeEach(function () {
      spyOn(this.model, '_getSelectedColumnType').and.returnValue('boolean');

      this.model.set('column', 'boolean');
    });

    // it('should not include default attributes', function () {
    //   expect(this.model.get('kind')).not.toBeDefined();
    //   expect(this.model.get('min')).not.toBeDefined();
    //   expect(this.model.get('max')).not.toBeDefined();
    // });

    // it('should have proper attributes', function () {
    //   expect(this.model.attributes).toEqual({
    //     id: 'a1',
    //     source: 'a0',
    //     type: 'filter-category',
    //     accept_reject: 'accept',
    //     column: '',
    //     text: ''
    //   });
    // });

    // it('should have generated form fields', function () {
    //   expect(Object.keys(this.model.schema).length).toBe(5);

    //   expect(this.model.schema.accept_reject).toBeDefined();
    // });

    // describe('result hide', function () {
    //   it('should have generated form fields', function () {
    //     // this.model.set('context', 'advance');

    //     // expect(Object.keys(this.model.schema).length).toBe(7);
    //     // expect(this.model.schema.street_address_column).not.toBeDefined();
    //     // expect(this.model.schema.street_address_template).toBeDefined();
    //   });

    //   it('should format street_address properly', function () {
    //     // spyOn(this.model._typeDef(), '_wrapInBraces').and.callThrough();

    //     // this.model.set('street_address_column', 'address');
    //     // this.model.set('context', 'advance');

    //     // expect(this.model._typeDef()._wrapInBraces).toHaveBeenCalledWith('address');
    //     // expect(this.model.get('street_address_template')).toBe('{{address}}');
    //   });
    // });
  });
});
