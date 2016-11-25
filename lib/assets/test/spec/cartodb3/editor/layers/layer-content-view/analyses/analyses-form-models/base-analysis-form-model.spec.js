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
      userModel: {},
      userActions: this.userActions,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: {}
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
});
