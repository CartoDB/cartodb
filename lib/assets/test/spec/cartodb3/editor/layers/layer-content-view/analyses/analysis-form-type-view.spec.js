var _ = require('underscore');
var Backbone = require('backbone');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisFormTypeView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-type-view');

describe('editor/layers/layer-content-view/analyses/analyses-form-type-view', function () {
  beforeEach(function () {
    this.formModel = new BaseAnalysisFormModel({
      id: 'a1',
      type: 'buffer',
      source: 'a0'
      // radius: 'invalid' // initial state, should not pass validation
    }, {
      layerDefinitionModel: {},
      analysisSourceOptionsModel: {}
    });
    spyOn(this.formModel, 'getTemplate').and.returnValue(_.template('<form>templateData? <%= hopefullyYes %></form>'));
    spyOn(this.formModel, 'getTemplateData').and.returnValue({hopefullyYes: 'yes'});

    this.view = new AnalysisFormTypeView({
      formModel: this.formModel
    });
    this.view.render();
  });

  it('should render with template and data from form model', function () {
    expect(this.view.$el.html()).toContain('form');
    expect(this.view.$el.html()).toContain('templateData? yes');
  });

  it('should have errors due to missing params', function () {
    expect(this.formModel.isValid()).toBe(false);

    this.formModel.set('radius', 100); // should make it valid
    this.view.render();
    expect(this.formModel.isValid()).toBe(true);

    this.formModel.unset('radius');
    this.view.render();
    expect(this.formModel.isValid()).toBe(false);
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
