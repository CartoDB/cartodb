var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

describe('components/form-components/editors/number', function () {
  var createViewFn = function (options) {
    var defaultOptions = {
      schema: {}
    };

    var view = new Backbone.Form.editors.Number(_.extend(defaultOptions, options));
    view.render();
    return view;
  };

  beforeEach(function () {
    this.view = createViewFn();
    this.view.render();
    this.$input = this.view.$('.js-input');
  });

  it('should render properly', function () {
    expect(this.$input.length).toBe(1);
    expect(this.view.$('.js-slider').length).toBe(1);
  });

  it('should not create the horizontal slider if not desired', function () {
    var view = createViewFn({
      showSlider: false
    });
    view.render();
    expect(view.$('.js-slider').length).toBe(0);
  });

  describe('max and min', function () {
    it('should get values by default', function () {
      expect(this.view.options.min).toBe(0);
      expect(this.view.options.max).toBe(10);
    });

    it('should accept max and min accross validators', function () {
      var view = createViewFn({
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

      it('should trigger change after debounce time', function (done) {
        var self = this;
        setTimeout(function () {
          expect(self.onChanged).toHaveBeenCalled();
          done();
        }, 334);
      });

      it('should update input', function () {
        expect(this.$input.val()).toBe('5');
      });
    });

    describe('when input changes', function () {
      beforeEach(function () {
        this.$input
          .val(6)
          .trigger('keyup');
      });

      it('should trigger change', function (done) {
        var self = this;
        setTimeout(function () {
          expect(self.onChanged).toHaveBeenCalled();
          done();
        }, 334);
      });

      it('should update input', function () {
        expect(this.view.$('.js-slider').slider('value')).toBe(6);
      });

      it('should increase the value when pressing the up key', function () {
        this.view.setValue(7);

        var e = $.Event('keydown');
        e.keyCode = e.which = 38;

        this.$input.trigger(e);
        this.$input.trigger(e);
        this.$input.trigger(e);

        expect(this.$input.val()).toBe('10');
      });

      it('should increase the value when pressing the up key and shift', function () {
        this.view.setValue(10);

        var e = $.Event('keydown');
        e.keyCode = e.which = 38;
        e.shiftKey = true;

        this.$input.trigger(e);
        this.$input.trigger(e);
        this.$input.trigger(e);

        expect(this.$input.val()).toBe('40');
      });

      it('should decrease the value when pressing the down key', function () {
        this.view.setValue(7);

        var e = $.Event('keydown');
        e.keyCode = e.which = 40;

        this.$input.trigger(e);
        this.$input.trigger(e);
        this.$input.trigger(e);

        expect(this.$input.val()).toBe('4');
      });

      it('should decrease the value when pressing the down key and shift', function () {
        this.view.setValue(70);

        var e = $.Event('keydown');
        e.keyCode = e.which = 40;
        e.shiftKey = true;

        this.$input.trigger(e);
        this.$input.trigger(e);
        this.$input.trigger(e);

        expect(this.$input.val()).toBe('40');
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
