var AnalysisOptionModel = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-option-models/analysis-option-model');
var AnalysisOptionView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-option-view');

describe('components/modals/add-analysis/analysis-option-view', function () {
  beforeEach(function () {
    this.model = new AnalysisOptionModel({
      title: 'Buffer',
      desc: 'describes the buffer type',
      type_group: 'area of influence'
    }, {
      nodeAttrs: {
        type: 'buffer'
      }
    });

    this.view = new AnalysisOptionView({
      model: this.model,
      simpleGeometryTypeInput: 'point'
    });
    this.view.render();
  });

  it('should render the info', function () {
    expect(this.view.$el.html()).toContain('Buffer');
    expect(this.view.$el.html()).toContain('describes the buffer');
    expect(this.view.$el.html()).toContain('area of influence');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when selected', function () {
    beforeEach(function () {
      this.model.set('selected', true);
    });

    it('should highlight the item', function () {
      expect(this.view.el.className).toContain('is-selected');
    });
  });

  describe('when geometry type does not match ', function () {
    beforeEach(function () {
      spyOn(this.model, 'acceptsGeometryTypeAsInput').and.returnValue(false);
      this.view.render();
    });

    it('should disable the view', function () {
      expect(this.view.el.className).toContain('is-disabled');
    });

    it('should show alternative desc', function () {
      expect(this.view.$el.html()).toContain('disabled-option-desc');
      expect(this.view.$el.html()).not.toContain('describes the buffer');
    });

    it('should not be able to select it', function () {
      this.view.$el.click();
      expect(this.view.el.className).not.toContain('selected');
    });
  });
});
