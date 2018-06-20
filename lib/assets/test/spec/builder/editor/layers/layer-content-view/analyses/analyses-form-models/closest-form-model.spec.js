var Backbone = require('backbone');
var cdb = require('internal-carto.js');
var Model = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/closest-form-model');
var BaseAnalysisFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/closest-form-model', function () {
  var cdbSQLBackup;

  beforeEach(function () {
    this.configModel = new Backbone.Model({});

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
    this.analysisSourceOptionsModel.getSelectOptions = function () {
      return [];
    };
    this.analysisSourceOptionsModel.createSourceNodeUnlessExisting = function () {};

    cdbSQLBackup = cdb.SQL;
    cdb.SQL = function () {
      return {
        execute: function () {}
      };
    };

    this.initializeOptions = {
      analyses: analyses,
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    };

    this.model = new Model(null, this.initializeOptions);
  });

  afterEach(function () {
    cdb.SQL = cdbSQLBackup;
  });

  describe('parse', function () {
    it('should set default value to responses property', function () {
      var parsed = this.model.parse({});

      expect(parsed.responses).toBe(1);
    });

    it('should not modify responses propertyif present', function () {
      var parsed = this.model.parse({responses: 32});

      expect(parsed.responses).toBe(32);
    });
  });

  describe('initialize', function () {
    it('should call proper function and hook events', function () {
      spyOn(BaseAnalysisFormModel.prototype, 'initialize');
      spyOn(this.model, '_resetColumnOptions');
      spyOn(this.model, '_initBinds');
      spyOn(this.model, '_setSchema');
      spyOn(this.model, '_fetchColumns');

      this.model.initialize(null, this.initializeOptions);

      expect(BaseAnalysisFormModel.prototype.initialize).toHaveBeenCalled();
      expect(this.model._resetColumnOptions).toHaveBeenCalled();
      expect(this.model._initBinds).toHaveBeenCalled();
      expect(this.model._setSchema).toHaveBeenCalled();
      expect(this.model._fetchColumns).toHaveBeenCalled();
    });
  });

  describe('_initBinds', function () {
    it('should hook up change:fetching and change:target events', function () {
      spyOn(this.model, '_onSourceOptionsFetched');

      this.model._initBinds();
      this.model._analysisSourceOptionsModel.set('fetching', true);

      expect(this.model._events['change:target']).toBeDefined();
      expect(this.model._onSourceOptionsFetched).toHaveBeenCalled();
    });
  });

  describe('.getTemplate', function () {
    it('should return the template', function () {
      var template = this.model.getTemplate();

      var templateContent = template({linkContent: '', hasTarget: false});
      expect(templateContent.indexOf('<form>')).toBeGreaterThan(-1);
      expect(templateContent.indexOf('data-fields="source,target"')).toBeGreaterThan(-1);
      expect(templateContent.indexOf('data-fields="responses,category"')).toBeGreaterThan(-1);
    });

    it('should disable 2nd step fields if hasTarget false', function () {
      var template = this.model.getTemplate();
      var templateContent = template({linkContent: '', hasTarget: false});
      expect(templateContent.indexOf('Editor-HeaderInfo is-disabled')).toBeGreaterThan(-1);
    });

    it('should not disable 2nd step fields if hasTarget true', function () {
      var template = this.model.getTemplate();
      var templateContent = template({linkContent: '', hasTarget: true});
      expect(templateContent.indexOf('Editor-HeaderInfo is-disabled')).toBe(-1);
    });
  });

  describe('.getTemplateData', function () {
    it('should return an object with hasTarget', function () {
      var templateData = this.model.getTemplateData();

      expect(templateData).toEqual({ hasTarget: false });
    });
  });

  describe('._resetColumnOptions', function () {
    it('should reset _columnOptions and hook up "columnsFetched" event', function () {
      this.model._columnOptions.set('aProperty', 'some value');
      spyOn(this.model, '_onColumnsFetched');

      this.model._resetColumnOptions();
      this.model._columnOptions.trigger('columnsFetched');

      expect(this.model._columnOptions.aProperty).not.toBeDefined();
      expect(this.model._onColumnsFetched).toHaveBeenCalled();
    });
  });

  describe('._onSourceOptionsFetched', function () {
    it('should call _setSchema', function () {
      spyOn(this.model, '_setSchema');

      this.model._onSourceOptionsFetched();

      expect(this.model._setSchema).toHaveBeenCalled();
    });
  });

  describe('._setSchema', function () {
    it('should call _setSchema of BaseAnalysisFormModel with proper schema', function () {
      spyOn(BaseAnalysisFormModel.prototype, '_setSchema');
      spyOn(this.model, '_primarySourceSchemaItem').and.callFake(function (title) {
        return title;
      });
      spyOn(this.model, '_getSourceOptionsForSource').and.callFake(function (sourceAttrName) {
        return sourceAttrName;
      });
      spyOn(this.model, '_isSourceDisabled').and.callFake(function (source) {
        return 'called with ' + source;
      });
      spyOn(this.model._columnOptions, 'filterByType').and.callFake(function (type) { return type; });

      var expectedSchema = {
        source: 'editor.layers.analysis-form.base-layer',
        target: {
          type: 'NodeDataset',
          title: 'editor.layers.analysis-form.target',
          options: {sourceAttrName: 'target', includeSourceNode: true},
          dialogMode: 'float',
          validators: ['required'],
          editorAttrs: {
            disabled: 'called with target'
          }
        },
        category: {
          type: 'EnablerEditor',
          title: '',
          label: 'editor.layers.analysis-form.group-by',
          help: 'editor.layers.analysis-form.find-nearest.categorized-help',
          editor: {
            type: 'Select',
            options: 'string',
            dialogMode: 'float',
            editorAttrs: {
              showLabel: false
            }
          }
        },
        responses: {
          type: 'Number',
          title: 'editor.layers.analysis-form.find-nearest.max-results',
          value: 1,
          validators: ['required', {
            type: 'interval',
            min: 1,
            max: 32
          }]
        }
      };

      this.model._setSchema();

      expect(BaseAnalysisFormModel.prototype._setSchema).toHaveBeenCalledWith(expectedSchema);
    });
  });

  describe('._isSourceDisabled', function () {
    it('should return if attr is primary source or it is fetching, combination 1', function () {
      spyOn(this.model, '_isPrimarySource').and.returnValue(true);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(false);

      var result = this.model._isSourceDisabled('target');

      expect(this.model._isPrimarySource).toHaveBeenCalledWith('target');
      expect(result).toBe(true);
    });

    it('should return if attr is primary source or it is fetching, combination 2', function () {
      spyOn(this.model, '_isPrimarySource').and.returnValue(false);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(true);

      var result = this.model._isSourceDisabled('target');

      expect(this.model._isFetchingOptions).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return if attr is primary source or it is fetching, combination 3', function () {
      spyOn(this.model, '_isPrimarySource').and.returnValue(false);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(false);

      var result = this.model._isSourceDisabled('target');

      expect(result).toBe(false);
    });
  });

  describe('._onChangeTarget', function () {
    it('should reset category and fetch columnds', function () {
      this.model.set('target', 'madrid');
      spyOn(this.model, '_setSchema');
      spyOn(this.model, '_fetchColumns');
      spyOn(this.model._analysisSourceOptionsModel, 'createSourceNodeUnlessExisting');

      this.model._onChangeTarget();

      expect(this.model.get('category')).toEqual('');
      expect(this.model._setSchema).toHaveBeenCalled();
      expect(this.model._analysisSourceOptionsModel.createSourceNodeUnlessExisting).toHaveBeenCalledWith('madrid');
      expect(this.model._fetchColumns).toHaveBeenCalled();
    });
  });

  describe('._fetchColumns', function () {
    beforeEach(function () {
      this.model.set('target', 'a layer');
      this.layerDefinitionModel.findAnalysisDefinitionNodeModel = function () {};
    });

    it('should set node in columnOptions if target is a node', function () {
      spyOn(this.model._layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue('node');
      spyOn(this.model._columnOptions, 'setNode');

      this.model._fetchColumns();

      expect(this.model._layerDefinitionModel.findAnalysisDefinitionNodeModel).toHaveBeenCalledWith('a layer');
      expect(this.model._columnOptions.setNode).toHaveBeenCalledWith('node');
    });

    it('should set target dataset in columnOptions if target is a dataset', function () {
      spyOn(this.model._layerDefinitionModel, 'findAnalysisDefinitionNodeModel').and.returnValue(null);
      spyOn(this.model._columnOptions, 'setDataset');

      this.model._fetchColumns();

      expect(this.model._layerDefinitionModel.findAnalysisDefinitionNodeModel).toHaveBeenCalledWith('a layer');
      expect(this.model._columnOptions.setDataset).toHaveBeenCalledWith('a layer');
    });
  });

  describe('._onColumnsFetched', function () {
    it('should call _setSchema', function () {
      spyOn(this.model, '_setSchema');

      this.model._onColumnsFetched();

      expect(this.model._setSchema).toHaveBeenCalled();
    });
  });
});
