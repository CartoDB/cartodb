var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/slider');

fdescribe('components/form-components/editors/slider', function () {
  beforeEach(function () {
    this.data = ['Huckepack', 'Naseweis', 'Packe', 'Pick', 'Puck', 'Purzelbaum', 'Rumpelbold'];

    this.view = new Backbone.Form.editors.Slider({
      data: this.data,
      schema: {}
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-slider').length).toBe(1);
    expect(this.view.$('.js-tick').length).toBe(this.data.length);
    expect(this.view.$('.js-label').text()).toBe('Huckepack');
  });

  describe('data', function () {
    it('should get a value by default', function () {
      expect(this.view.$('.js-label').text()).toBe('Huckepack');
    });

    describe('change value', function () {
      beforeEach(function () {
        this.onChanged = jasmine.createSpy('onChanged');
        this.view.bind('change', this.onChanged);
      });

      describe('when slider changes', function () {
        beforeEach(function () {
          var $slider = this.view.$('.js-slider');
          $slider.slider('option', 'slide').call($slider, {}, { value: 50 });
          $slider.slider('option', 'stop').call($slider);
        });

        it('should trigger change', function () {
          expect(this.onChanged).toHaveBeenCalled();
        });

        fit('should update label', function () {
          expect(this.view.$('.js-label').text()).toBe('Packe');
        });

        fit('should highlight tick', function () {
          expect(this.view.$('.js-tick:nth-child(2)').hasClass('is-highlighted')).toBeThruthy();
        });

        fit('should return value', function () {
          expect(this.view.getValue()).toBe(2);
        });
      });
    });

    it('should destroy horizontal slider when element is removed', function () {
      spyOn(this.view, '_destroySlider');
      this.view.remove();
      expect(this.view._destroySlider).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
