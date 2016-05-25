var Backbone = require('backbone');
var AreaOfInfluenceFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-form-types/area-of-influence-form-model');
var AnalysisFormTypeView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-form-types/analysis-form-type-view');

describe('editor/layers/layer-content-view/analyses-form-types/analyses-form-type-view', function () {
  beforeEach(function () {
    this.formModel = new AreaOfInfluenceFormModel({
      id: 'a1',
      type: 'buffer',
      source: 'a0',
      radius: undefined // invalid
    });

    this.view = new AnalysisFormTypeView({
      formModel: this.formModel
    });
    this.view.render();
  });

  it('should render a form', function () {
    expect(this.view.$('form').length).toEqual(1);
  });

  it('should have errors', function () {
    expect(this.formModel.has('errors')).toBe(true);

    this.formModel.set('radius', 100); // should make it valid
    this.view.render();
    expect(this.formModel.has('errors')).toBe(false, 'check that errors are set after the render call');

    this.formModel.unset('radius');
    this.view.render();
    expect(this.formModel.has('errors')).toBe(true);
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
