var Backbone = require('backbone');
var camshaftReference = require('../../../../../../../../javascripts/cartodb3/data/camshaft-reference');
var UserActions = require('../../../../../../../../javascripts/cartodb3/data/user-actions');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var BaseAnalysisFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var analyses = require('../../../../../../../../javascripts/cartodb3/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: {}
    });

    this.userActions = UserActions({
      userModel: {},
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });

    this.model = new BaseAnalysisFormModel(null, {
      analyses: analyses,
      configModel: {},
      userActions: this.userActions,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: new Backbone.Model({
        fetching: true
      })
    });

    spyOn(camshaftReference, 'validate');
  });

  describe('.validate', function () {
    it('should be valid if passing camshaft validation', function () {
      camshaftReference.validate.and.returnValue({some_required_param: 'is missing'});
      expect(this.model.isValid()).toBe(false);

      camshaftReference.validate.and.returnValue(undefined);
      expect(this.model.isValid()).toBe(true);
    });

    it('should return errors set through setFormValidationErrors', function () {
      expect(this.model.isValid()).toBe(true);
      expect(this.model.validationError).toBeNull();
      this.changeSpy = jasmine.createSpy('change');
      this.model.on('change', this.changeSpy);

      this.model.setFormValidationErrors({some_prop: 'invalid'});
      expect(this.model.isValid()).toBe(false);
      expect(this.model.validationError).toEqual({some_prop: 'invalid'});
      expect(this.changeSpy).toHaveBeenCalled();

      this.changeSpy.calls.reset();
      this.model.setFormValidationErrors(undefined);
      expect(this.model.isValid()).toBe(true);
      expect(this.model.validationError).toBeNull();
      expect(this.changeSpy).toHaveBeenCalled();
    });
  });

  describe('.updateNodeDefinition', function () {
    beforeEach(function () {
      this.nodeDefModel = new Backbone.Model({id: 'a1'});
      spyOn(this.nodeDefModel, 'set');

      this.model.set({
        id: 'a1',
        type: 'trade-area',
        isolines: '1',
        time: '123.75',
        dissolved: 'false',
        non_default_param: {}
      });

      this.expectedFormattedAttrs = {
        id: 'a1',
        type: 'trade-area',
        isolines: 1,
        time: 123.75,
        dissolved: false,
        non_default_param: {}
      };

      camshaftReference.validate.and.returnValue(true);
      spyOn(camshaftReference, 'parse').and.returnValue(this.expectedFormattedAttrs);

      this.model.updateNodeDefinition(this.nodeDefModel);
    });

    it('should parse attrs before', function () {
      expect(camshaftReference.parse).toHaveBeenCalledWith(this.model.attributes);
    });

    it('should update the node with parsed attrs', function () {
      expect(this.nodeDefModel.set).toHaveBeenCalled();
      expect(this.nodeDefModel.set.calls.argsFor(0)[0]).toEqual(this.expectedFormattedAttrs);
    });
  });

  describe('.createNodeDefinition', function () {
    beforeEach(function () {
      this.nodeDefModel = new Backbone.Model({id: 'a1'});
      spyOn(this.nodeDefModel, 'set');

      this.model.set({
        id: 'b1',
        type: 'trade-area',
        isolines: '1',
        time: '123.75',
        dissolved: 'false',
        non_default_param: {}
      });

      this.expectedFormattedAttrs = {
        id: 'b1',
        type: 'trade-area',
        isolines: 1,
        time: 123.75,
        dissolved: false,
        non_default_param: {}
      };

      camshaftReference.validate.and.returnValue(true);
      spyOn(camshaftReference, 'parse').and.returnValue(this.expectedFormattedAttrs);

      spyOn(this.userActions, 'createAnalysisNode').and.returnValue(this.nodeDefModel);

      this.model.createNodeDefinition(this.userActions);
    });

    it('should parse attrs before', function () {
      expect(camshaftReference.parse).toHaveBeenCalledWith(this.model.attributes);
    });

    it('should create a new node model', function () {
      expect(this.userActions.createAnalysisNode).toHaveBeenCalledWith(this.expectedFormattedAttrs, this.layerDefinitionModel);
    });

    it('should mark the model as persisted', function () {
      expect(this.model.get('persisted')).toBe(true);
    });
  });

  describe('._isPrimarySource', function () {
    it('should return if the attr argument is the primary source', function () {
      this.model.set('primary_source_name', 'target');

      expect(this.model._isPrimarySource('target')).toBe(true);
      expect(this.model._isPrimarySource('left_source')).toBe(false);
    });
  });

  describe('._isFetchingOptions', function () {
    it('should return true if it is fetching options', function () {
      expect(this.model._isFetchingOptions()).toBe(true);
    });
  });

  describe('._getSourceOptionsForSource', function () {
    it('should throw error if no sourceAttrName provided', function () {
      var self = this;
      function wrap () {
        self.model._getSourceOptionsForSource({});
      }

      expect(wrap).toThrow(Error('sourceAttrName is required.'));
    });

    it('should return source if it is the primary source and ignorePrimarySource is false', function () {
      var sourceAttrName = 'target';
      this.model.set(sourceAttrName, 'the source');
      spyOn(this.model, '_isPrimarySource').and.returnValue(true);

      var result = this.model._getSourceOptionsForSource({
        sourceAttrName: sourceAttrName
      });

      expect(result).toEqual(['the source']);
    });

    it('should return object with isLoading if it is fetching options', function () {
      var sourceAttrName = 'target';
      this.model.set(sourceAttrName, 'the source');
      spyOn(this.model, '_isPrimarySource').and.returnValue(true);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(true);

      var result = this.model._getSourceOptionsForSource({
        sourceAttrName: sourceAttrName,
        ignorePrimarySource: true
      });

      expect(result).toEqual([{
        val: 'the source',
        label: 'editor.layers.analysis-form.loading',
        isLoading: true
      }]);
    });

    it('should return source options if it is fetched', function () {
      var sourceAttrName = 'target';
      this.model.set(sourceAttrName, 'the source');
      this.model._layerDefinitionModel.set('source', 808);
      this.model._analysisSourceOptionsModel.getSelectOptions = function (geomType) {
        return [
          {
            val: 606,
            type: 'node'
          }, {
            val: 707,
            type: 'other'
          }, {
            val: 808,
            type: 'other'
          }
        ];
      };
      spyOn(this.model, '_isPrimarySource').and.returnValue(false);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(false);

      var result = this.model._getSourceOptionsForSource({
        sourceAttrName: sourceAttrName,
        ignorePrimarySource: true
      });

      expect(result).toEqual([
        {
          val: 606,
          type: 'node'
        }, {
          val: 707,
          type: 'other'
        }
      ]);
    });

    it('should return only source options with type node if it is fetched and onlyNodes option provided', function () {
      var sourceAttrName = 'target';
      this.model.set(sourceAttrName, 'the source');
      this.model._layerDefinitionModel.set('source', 808);
      this.model._analysisSourceOptionsModel.getSelectOptions = function () {};
      spyOn(this.model._analysisSourceOptionsModel, 'getSelectOptions').and.returnValue([
        {
          val: 606,
          type: 'node'
        }, {
          val: 707,
          type: 'other'
        }, {
          val: 808,
          type: 'other'
        }
      ]);
      spyOn(this.model, '_isPrimarySource').and.returnValue(false);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(false);

      var result = this.model._getSourceOptionsForSource({
        sourceAttrName: sourceAttrName,
        ignorePrimarySource: true,
        onlyNodes: true
      });

      expect(result).toEqual([{
        val: 606,
        type: 'node'
      }]);
      expect(this.model._analysisSourceOptionsModel.getSelectOptions).toHaveBeenCalledWith('*');
    });

    it('should call to getSelectOptions with the right type of geom if option is provided', function () {
      var sourceAttrName = 'target';
      this.model.set(sourceAttrName, 'the source');
      this.model._layerDefinitionModel.set('source', 808);
      this.model._analysisSourceOptionsModel.getSelectOptions = function () {};
      spyOn(this.model._analysisSourceOptionsModel, 'getSelectOptions').and.returnValue([]);
      spyOn(this.model, '_isPrimarySource').and.returnValue(false);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(false);

      this.model._getSourceOptionsForSource({
        sourceAttrName: sourceAttrName,
        ignorePrimarySource: true,
        onlyNodes: true,
        requiredSimpleGeometryType: 'point'
      });

      expect(this.model._analysisSourceOptionsModel.getSelectOptions).toHaveBeenCalledWith('point');
    });

    it('should return the layer source with the options if includeSourceNode param is provided', function () {
      var sourceAttrName = 'target';
      this.model.set(sourceAttrName, 'the source');
      this.model._layerDefinitionModel.set('source', 1);
      this.model._analysisSourceOptionsModel.getSelectOptions = function () {};
      spyOn(this.model._analysisSourceOptionsModel, 'getSelectOptions').and.returnValue([
        {
          val: 3,
          type: 'node'
        }, {
          val: 2,
          type: 'other'
        }, {
          val: 1,
          type: 'node'
        }
      ]);
      spyOn(this.model, '_isPrimarySource').and.returnValue(false);
      spyOn(this.model, '_isFetchingOptions').and.returnValue(false);

      var result = this.model._getSourceOptionsForSource({
        sourceAttrName: sourceAttrName,
        includeSourceNode: true
      });

      expect(result).toEqual([{
        val: 3,
        type: 'node'
      }, {
        val: 2,
        type: 'other'
      }, {
        val: 1,
        type: 'node'
      }]);
      expect(this.model._analysisSourceOptionsModel.getSelectOptions).toHaveBeenCalledWith('*');
    });
  });

  describe('.setSchema', function () {
    beforeEach(function () {
      this.onCreate = jasmine.createSpy('onCreate');
      this.onChange = jasmine.createSpy('onChange');

      this.model.on('createSchema', this.onCreate);
      this.model.on('changeSchema', this.onChange);
    });

    it('should send "createSchema" event when it is NOT already set', function () {
      this.model.schema = {};
      this.model._setSchema({});
      expect(this.onCreate).toHaveBeenCalled();
      expect(this.onChange).not.toHaveBeenCalled();

      this.onCreate.calls.reset();
      this.onChange.calls.reset();

      delete this.model.schema;
      this.model._setSchema({});
      expect(this.onCreate).toHaveBeenCalled();
      expect(this.onChange).not.toHaveBeenCalled();
    });

    it('should send "changeSchema" event when schema is already set', function () {
      this.model.schema = {
        whatever: 'hello'
      };
      this.model._setSchema({});
      expect(this.onCreate).not.toHaveBeenCalled();
      expect(this.onChange).toHaveBeenCalled();
    });
  });
});
