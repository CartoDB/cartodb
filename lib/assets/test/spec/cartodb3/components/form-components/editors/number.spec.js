var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/number.js');

describe('components/form-components/editors/number', function () {
  beforeEach(function () {
    this.view = new Backbone.Form.editors.Number({
      schema: {}
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-input').length).toBe(1);
    expect(this.view.$('.js-slider').length).toBe(1);
  });

  it('should create an horizontal slider', function () {
    expect(this.view.$('.js-slider').data('ui-slider')).not.toBeUndefined();
  });

  describe('max and min', function () {
    it('should get values by default', function () {
      expect(this.view.options.min).toBe(0);
      expect(this.view.options.max).toBe(10);
    });

    it('should accept max and min accross validators', function () {
      var view = new Backbone.Form.editors.Number({
        schema: {
          validators: ['required', {
            type: 'interval',
            min: 5,
            max: 30
          }]
        }
      });
      expect(view.options.min).toBe(5);
      expect(view.options.max).toBe(30);
    });
  });

  describe('change value', function () {
    beforeEach(function () {
      this.onChanged = jasmine.createSpy('onChanged');
      this.view.bind('change', this.onChanged);
    });

    describe('when slider changes', function () {
      beforeEach(function () {
        var $slider = this.view.$('.js-slider');
        $slider.slider('option', 'slide').call($slider, {}, { value: 5 });
        $slider.slider('option', 'stop').call($slider);
      });

      it('should trigger change', function () {
        expect(this.onChanged).toHaveBeenCalled();
      });

      it('should update input', function () {
        expect(this.view.$('.js-input').val()).toBe('5');
      });
    });

    describe('when input changes', function () {
      beforeEach(function () {
        this.view.$('.js-input')
          .val(6)
          .trigger('keyup');
      });

      it('should trigger change', function () {
        expect(this.onChanged).toHaveBeenCalled();
      });

      it('should update input', function () {
        expect(this.view.$('.js-slider').slider('value')).toBe(6);
      });

      it('should not accept letters or other characters, except . and numbers', function () {
        var $input = this.view.$('.js-input');
        expect($input.val()).toBe('6');
        $input.trigger('keydown', { which: 84 }); /* t */
        expect($input.val()).toBe('6');
        $input.trigger('keydown', { which: 111 }); /* / */
        expect($input.val()).toBe('6');
        $input.trigger('keydown', { which: 32 }); /* space  */
        expect($input.val()).toBe('6');
      });
    });
  });

  it('should destroy horizontal slider when element is removed', function () {
    spyOn(this.view, '_destroySlider');
    this.view.remove();
    expect(this.view._destroySlider).toHaveBeenCalled();
  });

  afterEach(function () {
    this.view.remove();
  });
});
