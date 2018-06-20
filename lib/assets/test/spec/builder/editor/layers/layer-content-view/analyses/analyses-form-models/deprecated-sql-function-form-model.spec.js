var Backbone = require('backbone');
var cdb = require('internal-carto.js');
var FormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/deprecated-sql-function-form-model');
var BaseAnalysisFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var analyses = require('builder/data/analyses');
var availableFunctionsQuery = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/available-functions.tpl');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/deprecated-sql-function-form-model', function () {
  var cdbSQLBackup;

  beforeEach(function () {
    this.configModel = new Backbone.Model({});

    cdbSQLBackup = cdb.SQL;
    cdb.SQL = function () {
      return {
        execute: function () {}
      };
    };

    this.layerDefinitionModel = new Backbone.Model({});
    this.layerDefinitionModel.getName = function () { return 'Layer Name'; };
    this.layerDefinitionModel.getTableName = function () { return 'table_name'; };
    this.layerDefinitionModel.findAnalysisDefinitionNodeModel = function () {
      var node = {
        id: 808,
        letter: function () { return 'A'; },
        getColor: function () { return '#fabada'; },
        isSourceType: function () { return true; },
        querySchemaModel: new Backbone.Model({
          query: 'SELECT * FROM somewhere;'
        })
      };
      return node;
    };
    this.layerDefinitionModel.getName = function () { return 'Metro Madrid'; };

    this.analysisSourceOptionsModel = new Backbone.Model({
      fetching: false
    });

    this.initializeOptions = {
      analyses: analyses,
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    };

    this.formModel = new FormModel(null, this.initializeOptions);
  });

  afterEach(function () {
    cdb.SQL = cdbSQLBackup;
  });

  describe('initialize', function () {
    it('should call proper function and hook events', function () {
      spyOn(BaseAnalysisFormModel.prototype, 'initialize');
      spyOn(this.formModel, '_setSchema');
      spyOn(this.formModel, '_initBinds');
      spyOn(this.formModel, '_fetchAvailableFunctions');

      this.formModel.initialize(null, this.initializeOptions);

      expect(BaseAnalysisFormModel.prototype.initialize).toHaveBeenCalled();
      expect(this.formModel._SQL).toBeDefined();
      expect(this.formModel.get('fetchStatus')).toBe('unfetched');
      expect(this.formModel._functionsInfo.length).toBe(0);
      expect(this.formModel._initBinds).toHaveBeenCalled();
      expect(this.formModel._setSchema).toHaveBeenCalled();
      expect(this.formModel._fetchAvailableFunctions).toHaveBeenCalled();
    });
  });

  describe('._initBinds', function () {
    it('should hook up the proper events', function () {
      expect(this.formModel._events['change:fetchStatus'].length).toBe(1);
      expect(this.formModel._events['change:function_name'].length).toBe(1);
      expect(this.formModel._analysisSourceOptionsModel._events['change:fetching'].length).toBe(1);
    });
  });

  describe('.validate', function () {
    it('should serialize function arguments', function () {
      var attrs = 'the attributes';
      var options = 'the options';
      var calls = [];
      spyOn(this.formModel, '_serializeFunctionArgs').and.callFake(function () {
        calls.push('serialize');
      });
      spyOn(BaseAnalysisFormModel.prototype, 'validate').and.callFake(function () {
        calls.push('validate');
      });

      this.formModel.validate(attrs, options);

      expect(calls[0]).toEqual('serialize');
      expect(calls[1]).toEqual('validate');
    });
  });

  describe('.getTemplate', function () {
    it('should return sql function template', function () {
      var template = this.formModel.getTemplate()({
        fields: ['oneField', 'otherField']
      });

      expect(template).toContain('data-fields="oneField,otherField"');
      expect(template).toContain('editor.layers.analysis-form.deprecated-sql-function.title');
    });
  });

  describe('.getTemplateData', function () {
    it('should return proper fields of the selected function', function () {
      var selectedFunction = 'dep_ext_fakeFunk';
      this.formModel._functionsInfo = [{
        functionName: selectedFunction,
        hasSecondaryNode: true,
        params: {
          radius: 'number',
          includeCities: 'boolean'
        }
      }];
      this.formModel.attributes.function_name = selectedFunction;

      var templateData = this.formModel.getTemplateData();

      expect(templateData.fields).toEqual('secondary_source,radius,includeCities');
    });
  });

  // _getSelectedFunctions gets tested with this spec as well
  describe('.setSchema, ._buildSchema and _addParamToSchema', function () {
    it('should return schema based of selected function params', function () {
      var selectedFunction = 'dep_ext_fakeFunk';
      this.formModel.attributes.function_name = selectedFunction;
      this.formModel._functionsInfo = [{
        functionName: selectedFunction,
        hasSecondaryNode: true,
        params: {
          radius: 'number',
          includeCities: 'boolean',
          category: 'string'
        }
      }];
      spyOn(this.formModel, '_getSourceOptionsForSource').and.returnValue('sourceOptionsForSource');

      var schema = this.formModel._buildSchema();

      // Primary source
      expect(schema.primary_source).toBeDefined();
      expect(schema.primary_source.title).toEqual('editor.layers.analysis-form.deprecated-sql-function.input');
      expect(schema.primary_source.type).toEqual('NodeDataset');

      // Secondary source
      expect(schema.secondary_source).toBeDefined();
      expect(schema.secondary_source.options).toEqual('sourceOptionsForSource');
      expect(schema.secondary_source.title).toEqual('editor.layers.analysis-form.deprecated-sql-function.target');
      expect(schema.secondary_source.type).toEqual('NodeDataset');

      // Number param
      expect(schema.radius).toBeDefined();
      expect(schema.radius.showSlider).toBe(false);
      expect(schema.radius.title).toBe('radius');
      expect(schema.radius.type).toBe('Number');
      expect(schema.radius.validators[0]).toBe('required');
      expect(this.formModel.get('radius')).toBe(0);

      // Boolean param
      expect(schema.includeCities).toBeDefined();
      expect(schema.includeCities.title).toBe('includeCities');
      expect(schema.includeCities.type).toBe('Radio');
      expect(schema.includeCities.options[0]).toEqual({val: 'true', label: 'true'});
      expect(schema.includeCities.options[1]).toEqual({val: 'false', label: 'false'});
      expect(this.formModel.get('includeCities')).toBe(true);

      // String param
      expect(schema.category).toBeDefined();
      expect(schema.category.title).toBe('category');
      expect(schema.category.type).toBe('Text');
      expect(schema.category.validators[0]).toBe('required');
      expect(this.formModel.get('category')).toBe('');
    });

    it('.setSchema should call base form', function () {
      spyOn(BaseAnalysisFormModel.prototype, '_setSchema');
      spyOn(this.formModel, '_buildSchema').and.returnValue('schema built');

      this.formModel._setSchema();

      expect(BaseAnalysisFormModel.prototype._setSchema).toHaveBeenCalledWith('schema built');
    });
  });

  describe('_onSourceOptionsFetched', function () {
    it('should call _setSchema', function () {
      spyOn(this.formModel, '_setSchema');

      this.formModel._onSourceOptionsFetched();

      expect(this.formModel._setSchema).toHaveBeenCalled();
    });
  });

  describe('_onFetchStatusChanged', function () {
    it('should call _setSchema', function () {
      spyOn(this.formModel, '_setSchema');

      this.formModel._onSourceOptionsFetched();

      expect(this.formModel._setSchema).toHaveBeenCalled();
    });
  });

  describe('_onFunctionSelected', function () {
    it('should call _setSchema', function () {
      spyOn(this.formModel, '_setSchema');

      this.formModel._onSourceOptionsFetched();

      expect(this.formModel._setSchema).toHaveBeenCalled();
    });
  });

  describe('._fetchAvailableFunctions', function () {
    var SQL;
    var SQLcallbacks;
    var queryUsed;
    var trackBackup;

    beforeEach(function () {
      SQL = this.formModel._SQL;
      this.formModel._SQL = {
        execute: function (query, whatever, callbacks) {
          queryUsed = query;
          SQLcallbacks = callbacks;
        }
      };
      trackBackup = window.trackJs;
    });

    afterEach(function () {
      this.formModel._SQL = SQL;
      SQLcallbacks = null;
      queryUsed = null;
      window.trackJs = trackBackup;
    });

    // This test checks also _parseFunctionsMetadata and _capitalizeFunctionName
    it('should fill _functionsInfo if successful', function () {
      var metadata = {
        rows: [{
          fn_name: 'dep_ext_funk',
          has_secondary_node: true,
          params_names: ['radius', 'category'],
          params_types: ['number', 'string']
        }, {
          fn_name: 'dep_ext_empty',
          has_secondary_node: false,
          params_names: [],
          params_types: []
        }]
      };
      this.formModel._fetchAvailableFunctions();

      expect(this.formModel.get('fetchStatus')).toEqual('fetching');

      SQLcallbacks.success(metadata);

      expect(this.formModel.get('fetchStatus')).toEqual('fetched');
      expect(this.formModel._functionsInfo.length).toBe(2);
      var first = this.formModel._functionsInfo[0];
      var second = this.formModel._functionsInfo[1];
      expect(first).toEqual({
        functionName: 'DEP_EXT_funk',
        hasSecondaryNode: true,
        params: {
          category: 'string',
          radius: 'number'
        }
      });
      expect(second).toEqual({
        functionName: 'DEP_EXT_empty',
        hasSecondaryNode: false,
        params: {}
      });
      expect(queryUsed).toEqual(availableFunctionsQuery());
    });

    it('should track error if error', function () {
      var errors = {
        responseJSON: '{anError: {}}'
      };
      var errorTracked;
      window.trackJs = {
        track: function (error) {
          errorTracked = error;
        }
      };
      this.formModel._fetchAvailableFunctions();

      expect(this.formModel.get('fetchStatus')).toEqual('fetching');

      SQLcallbacks.error(errors);

      expect(this.formModel.get('fetchStatus')).toEqual('error');
      expect(errorTracked).toEqual(errors.responseJSON);
    });
  });

  describe('_getSelectFunctionAttrs', function () {
    it('should return correct options for select function dropdown', function () {
      // Unfetched
      this.formModel.attributes.fetchStatus = 'unfetched';

      var status = this.formModel._getSelectFunctionAttrs();

      expect(status).toEqual({
        disabled: true
      });

      // Fetching
      this.formModel.attributes.fetchStatus = 'fetching';

      status = this.formModel._getSelectFunctionAttrs();

      expect(status).toEqual({
        disabled: true,
        loading: true
      });

      // Fetched
      this.formModel.attributes.fetchStatus = 'fetched';

      status = this.formModel._getSelectFunctionAttrs();

      expect(status).toEqual({});

      this.formModel._functionsInfo = ['one', 'two'];

      status = this.formModel._getSelectFunctionAttrs();

      expect(status).toEqual({
        placeholder: 'editor.layers.analysis-form.deprecated-sql-function.choose-function-small'
      });

      // Error
      this.formModel.attributes.fetchStatus = 'error';

      status = this.formModel._getSelectFunctionAttrs();

      expect(status).toEqual({
        disabled: true,
        placeholder: 'error'
      });
    });
  });

  describe('_parseFunctionOptions', function () {
    it('should parse functions info to dropdown values', function () {
      this.formModel._functionsInfo = [
        { functionName: 'dep_ext_funk' },
        { functionName: 'dep_ext_soul' }
      ];

      var parsed = this.formModel._parseFunctionOptions();

      expect(parsed.length).toBe(2);
      expect(parsed).toEqual([
        { val: 'dep_ext_funk', label: 'dep_ext_funk' },
        { val: 'dep_ext_soul', label: 'dep_ext_soul' }
      ]);
    });
  });

  describe('._serializeFunctionArgs', function () {
    it('should set function_args to equal the arguments of the selected function', function () {
      this.formModel.attributes.function_name = 'dep_ext_funk';
      this.formModel.attributes.radius = 808;
      this.formModel.attributes.category = 'place';
      this.formModel._functionsInfo = [
        {
          functionName: 'dep_ext_funk',
          params: {
            radius: 'number',
            category: 'string'
          }
        }
      ];

      this.formModel._serializeFunctionArgs();

      expect(this.formModel.get('function_args')).toEqual([808, 'place']);
    });
  });
});
