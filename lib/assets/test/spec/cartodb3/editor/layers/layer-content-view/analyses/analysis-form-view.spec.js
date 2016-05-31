var Backbone = require('backbone');
var camshaftReference = require('../../../../../../../javascripts/cartodb3/data/camshaft-reference');
var areaOfInfluenceTemplate = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form.tpl');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisFormView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-view');

describe('editor/layers/layer-content-view/analyses/analysis-form-view', function () {
  beforeEach(function () {
    this.formModel = new BaseAnalysisFormModel({
      id: 'a1',
      type: 'buffer',
      source: 'a0',
      radius: '100'
    }, {
      layerDefinitionModel: {},
      analysisSourceOptionsModel: {}
    });
    this.formModel.schema.source = {type: 'Text'};
    this.formModel.schema.radius = {type: 'Number'};
    spyOn(this.formModel, 'getTemplate').and.returnValue(areaOfInfluenceTemplate);
    spyOn(this.formModel, 'getTemplateData').and.returnValue({parametersDataFields: 'radius'});
    spyOn(this.formModel, 'setFormValidationErrors').and.callThrough();
    spyOn(camshaftReference, 'validate');

    this.view = new AnalysisFormView({
      formModel: this.formModel
    });
    this.view.render();
  });

  it('should render with template and data from form model', function () {
    expect(this.view.$el.html()).toContain('form');
    expect(this.view.$el.html()).toContain('data-fields="radius"');
  });

  it('should not validate when view is rendered intially', function () {
    expect(camshaftReference.validate).not.toHaveBeenCalled();
  });

  describe('when form changes', function () {
    beforeEach(function () {
      camshaftReference.validate.and.returnValue({radius: '42 is not the answer, you fool!'});

      // simulate change
      this.view._analysisFormView.setValue('radius', '42');
      this.view._analysisFormView.trigger('change');
    });

    it('should show errors when validation fails', function () {
      expect(camshaftReference.validate).toHaveBeenCalled();
      expect(this.view.$el.html()).toContain('Error');
    });

    it('should set form validation errors on the model', function () {
      expect(this.formModel.setFormValidationErrors).toHaveBeenCalled();
      expect(this.formModel.setFormValidationErrors.calls.argsFor(0)[0]).toBeUndefined();
      expect(this.formModel.setFormValidationErrors.calls.argsFor(1)[0]).toEqual({radius: jasmine.any(String)});
    });

    it('should not update model', function () {
      expect(this.formModel.get('radius')).toEqual('100');
    });

    describe('when validation passes', function () {
      beforeEach(function () {
        this.formModel.setFormValidationErrors.calls.reset();
        camshaftReference.validate.and.returnValue(undefined);

        // simulate change
        this.view._analysisFormView.setValue('radius', '20');
        this.view._analysisFormView.trigger('change');
      });

      it('should remove form validation errors', function () {
        expect(this.formModel.setFormValidationErrors.calls.argsFor(0)[0]).toBeUndefined();
        expect(this.formModel.setFormValidationErrors.calls.argsFor(1)[0]).toBeUndefined();
      });

      it('should update model', function () {
        expect(this.formModel.get('radius')).toEqual('20');
      });
    });
  });

  describe('when schema changes', function () {
    beforeEach(function () {
      this.prev$form = this.view.$('form');
      this.formModel.trigger('changeSchema');
    });

    afterEach(function () {
      this.prev$form = null;
    });

    it('should re-render the form', function () {
      expect(this.view.$('form').length).toEqual(1);
      expect(this.view.$('form')).not.toBe(this.prev$form);
    });
  });

  describe('when form is cleaned', function () {
    beforeEach(function () {
      spyOn(Backbone.Form.prototype, 'remove').and.callThrough();
      this.view.clean();
    });

    it('should remove form when view is cleaned', function () {
      expect(Backbone.Form.prototype.remove).toHaveBeenCalled();
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
