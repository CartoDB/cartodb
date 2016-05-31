var cdb = require('cartodb.js');
var camshaftReference = require('../../../../../../../../javascripts/cartodb3/data/camshaft-reference');
var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var BaseAnalysisFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: {}
    });
    spyOn(this.layerDefinitionModel, 'createNewAnalysisNode');

    this.model = new BaseAnalysisFormModel(null, {
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

  describe('.save', function () {
    beforeEach(function () {
      this.nodeDefModel = new cdb.core.Model({id: 'a1'});
      spyOn(this.nodeDefModel, 'set');
      spyOn(this.nodeDefModel, 'save');

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

      spyOn(camshaftReference, 'parse').and.returnValue(this.expectedFormattedAttrs);
    });

    describe('when model is not valid', function () {
      beforeEach(function () {
        camshaftReference.validate.and.returnValue({some_param: 'is invalid'});
        this.model.save();
        this.model.set('id', 'b1');
        this.model.save();
      });

      it('should not save anything', function () {
        expect(this.nodeDefModel.set).not.toHaveBeenCalled();
        expect(this.nodeDefModel.save).not.toHaveBeenCalled();
        expect(this.layerDefinitionModel.createNewAnalysisNode).not.toHaveBeenCalled();
      });
    });

    describe('when model is valid', function () {
      beforeEach(function () {
        camshaftReference.validate.and.returnValue(true);
        spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel');
      });

      describe('when form model represents an existing node', function () {
        beforeEach(function () {
          this.layerDefinitionModel.findAnalysisDefinitionNodeModel.and.returnValue(this.nodeDefModel);
          this.model.save();
        });

        it('should find node by id', function () {
          expect(this.layerDefinitionModel.findAnalysisDefinitionNodeModel).toHaveBeenCalledWith('a1');
        });

        it('should parse attrs before', function () {
          expect(camshaftReference.parse).toHaveBeenCalledWith(this.model.attributes);
        });

        it('should update the node with parsed attrs', function () {
          expect(this.nodeDefModel.set).toHaveBeenCalled();
          expect(this.nodeDefModel.set.calls.argsFor(0)[0]).toEqual(this.expectedFormattedAttrs);
        });
      });

      describe('when form represents a new node', function () {
        beforeEach(function () {
          this.model.set('id', 'b1');
          this.model.save();
        });

        it('should find node by id', function () {
          expect(this.layerDefinitionModel.findAnalysisDefinitionNodeModel).toHaveBeenCalledWith('b1');
        });

        it('should parse attrs before', function () {
          expect(camshaftReference.parse).toHaveBeenCalledWith(this.model.attributes);
        });

        it('should create a new node model', function () {
          expect(this.layerDefinitionModel.createNewAnalysisNode).toHaveBeenCalled();
          expect(this.layerDefinitionModel.createNewAnalysisNode.calls.argsFor(0)[0]).toEqual(this.expectedFormattedAttrs);
        });
      });
    });
  });
});
