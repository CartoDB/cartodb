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
  });

  describe('when given a simple geometry type', function () {
    beforeEach(function () {
      this.view = new AnalysisOptionView({
        model: this.model,
        simpleGeometryTypeInput: 'point'
      });
      this.view.render();
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render the info', function () {
      expect(this.view.$el.html()).toContain('Buffer');
      expect(this.view.$el.html()).toContain('describes the buffer');
    });

    it('should render the info link and trigger the info event', function () {
      var clicked = false;

      expect(this.view.$('.js-more').length).toBe(1);

      this.view.bind('onClickInfo', function () {
        clicked = true;
      }, this);

      this.view.$('.js-more').click();

      expect(clicked).toBeTruthy();
      expect(this.model.get('selected')).toBeTruthy();
    });

    it('should render the animation', function () {
      expect(this.view.$('.js-animation').length).toBe(1);
    });

    it('should launch the animation on hover', function () {
      this.view._acceptsInputGeometry = function () { return true; };

      this.view.$el.trigger('mouseenter');
      expect(this.view.$('.js-animation').hasClass('has-autoplay')).toBeTruthy();

      this.view.$el.trigger('mouseleave');
      expect(this.view.$('.js-animation').hasClass('has-autoplay')).toBeFalsy();
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

  describe('when not given any geometry type', function () {
    beforeEach(function () {
      this.view = new AnalysisOptionView({
        model: this.model
      });
      this.view.render();
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });
});
