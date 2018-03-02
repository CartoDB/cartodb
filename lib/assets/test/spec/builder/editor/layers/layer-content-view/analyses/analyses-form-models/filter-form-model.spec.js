var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var analyses = require('builder/data/analyses');
var FilterFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/filter-form-model');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');

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
      greater_than_or_equal: 0,
      less_than_or_equal: 50,
      greater_than: 0,
      less_than: 50,
      column: '',
      accept_reject: 'accept'
    });
  });

  it('should have generated form fields', function () {
    expect(Object.keys(this.model.schema).length).toBe(5);

    expect(this.model.schema.min).not.toBeDefined();
    expect(this.model.schema.max).not.toBeDefined();
  });

  it('should format the attributes', function () {
    expect(this.model._formatAttrs(this.model.attributes)).toEqual({
      id: 'a1',
      source: 'a0',
      type: 'filter-range',
      column: null,
      kind: 'between',
      greater_than_or_equal: 0,
      less_than_or_equal: 50
    });
  });

  it('should have the second step disabled for no column', function () {
    var templateData = { linkContent: '', column: null, histogram_stats: null, parametersDataFields: '' };
    expect(this.model.getTemplate()(templateData)).toContain('Editor-HeaderInfo is-disabled');
  });

  it('should enable the second step if column selected', function () {
    var templateData = { linkContent: '', column: 'morty', histogram_stats: null, parametersDataFields: '' };
    expect(this.model.getTemplate()(templateData)).not.toContain('Editor-HeaderInfo is-disabled');
  });

  describe('number', function () {
    beforeEach(function () {
      spyOn(this.model, '_getSelectedColumnType').and.returnValue('number');

      this.model.set('column', 'number');
    });

    describe('kind is-equal-to', function () {
      beforeEach(function () {
        this.model.set({
          kind: 'is-equal-to',
          text: 1
        });
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-equal-to',
          greater_than_or_equal: 0,
          less_than_or_equal: 50,
          greater_than: 0,
          less_than: 50,
          text: 1
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.text).toBeDefined();
        expect(this.model.schema.min).not.toBeDefined();
        expect(this.model.schema.max).not.toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          column: 'number',
          kind: 'is-equal-to',
          accept: [1]
        });
      });
    });

    describe('kind is-less-or-equal-than', function () {
      beforeEach(function () {
        this.model.set({
          kind: 'is-less-or-equal-than',
          less_than_or_equal: 4
        });
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-less-or-equal-than',
          greater_than_or_equal: 0,
          less_than_or_equal: 4,
          greater_than: 0,
          less_than: 50
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.less_than_or_equal).toBeDefined();
        expect(this.model.schema.less_than).not.toBeDefined();
        expect(this.model.schema.greater_than).not.toBeDefined();
        expect(this.model.schema.greater_than_or_equal).not.toBeDefined();
        expect(this.model.schema.text).not.toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          column: 'number',
          kind: 'is-less-or-equal-than',
          less_than_or_equal: 4
        });
      });
    });

    describe('kind is-less-than', function () {
      beforeEach(function () {
        this.model.set({
          kind: 'is-less-than',
          less_than: 1
        });
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-less-than',
          greater_than_or_equal: 0,
          less_than_or_equal: 50,
          greater_than: 0,
          less_than: 1
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.less_than).toBeDefined();
        expect(this.model.schema.greater_than).not.toBeDefined();
        expect(this.model.schema.greater_than_or_equal).not.toBeDefined();
        expect(this.model.schema.less_than_or_equal).not.toBeDefined();
        expect(this.model.schema.text).not.toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          column: 'number',
          kind: 'is-less-than',
          less_than: 1
        });
      });
    });

    describe('kind is-greater-than', function () {
      beforeEach(function () {
        this.model.set({
          kind: 'is-greater-than',
          greater_than: 1
        });
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-greater-than',
          greater_than_or_equal: 0,
          less_than_or_equal: 50,
          greater_than: 1,
          less_than: 50
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.greater_than).toBeDefined();
        expect(this.model.schema.greater_than_or_equal).not.toBeDefined();
        expect(this.model.schema.less_than_or_equal).not.toBeDefined();
        expect(this.model.schema.less_than).not.toBeDefined();
        expect(this.model.schema.text).not.toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          column: 'number',
          kind: 'is-greater-than',
          greater_than: 1
        });
      });
    });

    describe('kind is-greater-or-equal-than', function () {
      beforeEach(function () {
        this.model.set({
          kind: 'is-greater-or-equal-than',
          greater_than_or_equal: 4
        });
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          accept_reject: 'accept',
          column: 'number',
          kind: 'is-greater-or-equal-than',
          greater_than_or_equal: 4,
          less_than_or_equal: 50,
          greater_than: 0,
          less_than: 50
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.greater_than_or_equal).toBeDefined();
        expect(this.model.schema.less_than_or_equal).not.toBeDefined();
        expect(this.model.schema.less_than).not.toBeDefined();
        expect(this.model.schema.greater_than).not.toBeDefined();
        expect(this.model.schema.text).not.toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-range',
          column: 'number',
          kind: 'is-greater-or-equal-than',
          greater_than_or_equal: 4
        });
      });
    });
  });

  describe('string', function () {
    beforeEach(function () {
      spyOn(this.model, '_getSelectedColumnType').and.returnValue('string');

      this.model.set({
        column: 'string',
        text: 'wadus'
      });
    });

    describe('accept', function () {
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
          greater_than_or_equal: 0,
          less_than_or_equal: 50,
          greater_than: 0,
          less_than: 50,
          text: 'wadus'
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.text).toBeDefined();
        expect(this.model.schema.accept_reject).toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          column: 'string',
          accept: ['wadus']
        });
      });
    });

    describe('reject', function () {
      beforeEach(function () {
        this.model.set('accept_reject', 'reject');
      });

      it('should not include default attributes', function () {
        expect(this.model.get('kind')).toBe(null);
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          accept_reject: 'reject',
          column: 'string',
          kind: null,
          greater_than_or_equal: 0,
          less_than_or_equal: 50,
          greater_than: 0,
          less_than: 50,
          text: 'wadus'
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.text).toBeDefined();
        expect(this.model.schema.accept_reject).toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          column: 'string',
          reject: ['wadus']
        });
      });
    });
  });

  describe('boolean', function () {
    beforeEach(function () {
      spyOn(this.model, '_getSelectedColumnType').and.returnValue('boolean');

      this.model.set({
        column: 'boolean',
        text: 'true'
      });
    });

    it('should not include default attributes', function () {
      expect(this.model.get('kind')).toBe('is-boolean');
    });

    describe('accept', function () {
      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          accept_reject: 'accept',
          column: 'boolean',
          kind: 'is-boolean',
          greater_than_or_equal: 0,
          less_than_or_equal: 50,
          greater_than: 0,
          less_than: 50,
          text: 'true'
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.text).toBeDefined();
        expect(this.model.schema.accept_reject).toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          column: 'boolean',
          kind: 'is-boolean',
          accept: ['true']
        });
      });
    });

    describe('reject', function () {
      beforeEach(function () {
        this.model.set('accept_reject', 'reject');
      });

      it('should have proper attributes', function () {
        expect(this.model.attributes).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          accept_reject: 'reject',
          column: 'boolean',
          kind: 'is-boolean',
          greater_than_or_equal: 0,
          less_than_or_equal: 50,
          greater_than: 0,
          less_than: 50,
          text: 'true'
        });
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBe(4);

        expect(this.model.schema.text).toBeDefined();
        expect(this.model.schema.accept_reject).toBeDefined();
      });

      it('should format the attributes', function () {
        expect(this.model._formatAttrs(this.model.attributes)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'filter-category',
          column: 'boolean',
          kind: 'is-boolean',
          reject: ['true']
        });
      });
    });
  });
});
