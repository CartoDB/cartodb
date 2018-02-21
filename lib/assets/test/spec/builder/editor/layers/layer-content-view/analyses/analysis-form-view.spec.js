var Backbone = require('backbone');
var camshaftReference = require('builder/data/camshaft-reference');
var areaOfInfluenceTemplate = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/area-of-influence-form.tpl');
var BaseAnalysisFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisFormView = require('builder/editor/layers/layer-content-views/analyses/analysis-form-view');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-view/analyses/analysis-form-view', function () {
  beforeEach(function () {
    this.formModel = new BaseAnalysisFormModel({
      id: 'a1',
      type: 'buffer',
      source: 'a0',
      radius: '100'
    }, {
      analyses: analyses,
      configModel: {},
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
      formModel: this.formModel,
      configModel: {}
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

  describe('when form changes with erroneous data', function () {
    beforeEach(function () {
      camshaftReference.validate.and.returnValue({radius: '42 is not the answer, you fool!'});

      // simulate change
      this.view._formView.setValue('radius', '42');
      this.view._formView.trigger('change');
    });

    it('should show errors when validation fails', function (done) {
      var self = this;

      setTimeout(function () {
        expect(camshaftReference.validate).toHaveBeenCalled();
        expect(self.view.$el.html()).toContain('Error');
        done();
      }, 0);
    });

    it('should update form model anyway', function () {
      expect(this.formModel.get('radius')).toEqual(42);
    });

    it('should set form validation errors on the model', function (done) {
      var self = this;

      setTimeout(function () {
        expect(self.formModel.setFormValidationErrors).toHaveBeenCalled();
        expect(self.formModel.setFormValidationErrors.calls.argsFor(0)[0]).toBeUndefined();
        expect(self.formModel.setFormValidationErrors.calls.argsFor(1)[0]).toEqual({radius: jasmine.any(String)});
        done();
      }, 0);
    });

    describe('when validation passes', function () {
      beforeEach(function () {
        this.formModel.setFormValidationErrors.calls.reset();
        camshaftReference.validate.and.returnValue(undefined);

        // simulate change
        this.view._formView.setValue('radius', '20');
        this.view._formView.trigger('change');
      });

      it('should remove form validation errors', function () {
        expect(this.formModel.setFormValidationErrors.calls.argsFor(0)[0]).toBeUndefined();
        expect(this.formModel.setFormValidationErrors.calls.argsFor(1)[0]).toBeUndefined();
      });

      it('should update model', function () {
        expect(this.formModel.get('radius')).toEqual(20);
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

  describe('_onChangeAnalysisFormView and _showAnalysisFormErrors', function () {
    it('_onChangeAnalysisFormView calls _showAnalysisFormErrors with the form view Id that was active when the function was called', function (done) {
      var self = this;

      spyOn(this.view, '_showAnalysisFormErrors');
      var formId = this.view._formView.cid;

      this.view._onChangeAnalysisFormView();

      setTimeout(function () {
        expect(self.view._showAnalysisFormErrors).toHaveBeenCalledWith(formId);
        done();
      }, 0);
    });

    it('_showAnalysisFormErrors should not commit the form if the current form is different from the one who called it', function () {
      var _prevShowFn = this.view._showAnalysisFormErrors;
      var self = this;
      spyOn(this.view, '_showAnalysisFormErrors').and.callFake(function (formId) {
        self.view._formView.cid = 'another-form-808';
        _prevShowFn.call(this, formId);
      });
      spyOn(this.view, '_formView');

      this.view._onChangeAnalysisFormView();

      expect(this.view._formView).not.toHaveBeenCalled();
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
