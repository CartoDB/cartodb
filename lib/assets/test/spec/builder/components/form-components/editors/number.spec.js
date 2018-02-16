var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
// Required for affected specs, because we use backbone-forms through a global namespace
require('builder/components/form-components/editors/number/number.js');

var ARROW_UP_KEY = 38;
var ARROW_DOWN_KEY = 40;

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

  afterEach(function () {
    this.view.remove();
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
        this.$input.val(6).trigger('keyup');
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

      describe('when pressing the UP key', function () {
        it('should increase the value', function () {
          this.view.setValue(7);

          var event = $.Event('keydown');
          event.keyCode = event.which = ARROW_UP_KEY;

          this.$input.trigger(event);
          this.$input.trigger(event);
          this.$input.trigger(event);

          expect(this.$input.val()).toBe('10');
        });

        it('should increase the value when pressing shift', function () {
          this.view.setValue(0);

          var event = $.Event('keydown');
          event.keyCode = event.which = ARROW_UP_KEY;
          event.shiftKey = true;

          this.$input.trigger(event);

          expect(this.$input.val()).toBe('10');
        });

        it('should not increase the value if it exceeds the max allowed', function () {
          this.view.setValue(10);

          var event = $.Event('keydown');
          event.keyCode = event.which = ARROW_UP_KEY;

          this.$input.trigger(event);
          this.$input.trigger(event);
          this.$input.trigger(event);

          expect(this.$input.val()).toBe('10');
        });
      });

      describe('when pressing the DOWN key', function () {
        it('should decrease the value', function () {
          this.view.setValue(7);

          var event = $.Event('keydown');
          event.keyCode = event.which = ARROW_DOWN_KEY;

          this.$input.trigger(event);
          this.$input.trigger(event);
          this.$input.trigger(event);

          expect(this.$input.val()).toBe('4');
        });

        it('should decrease the value when pressing shift', function () {
          this.view.setValue(10);

          var event = $.Event('keydown');
          event.keyCode = event.which = ARROW_DOWN_KEY;
          event.shiftKey = true;

          this.$input.trigger(event);

          expect(this.$input.val()).toBe('0');
        });

        it('should not decrease the value if it exceeds the max allowed', function () {
          this.view.setValue(0);

          var event = $.Event('keydown');
          event.keyCode = event.which = ARROW_DOWN_KEY;

          this.$input.trigger(event);
          this.$input.trigger(event);
          this.$input.trigger(event);

          expect(this.$input.val()).toBe('0');
        });

        it('should work with negative min value', function () {
          var view = createViewFn({
            schema: {
              validators: ['required', {
                type: 'interval',
                min: -5,
                max: 10
              }]
            }
          });
          var $input = view.$('.js-input');
          view.setValue(0);

          var event = $.Event('keydown');
          event.keyCode = event.which = ARROW_DOWN_KEY;

          $input.trigger(event);
          $input.trigger(event);
          $input.trigger(event);

          expect($input.val()).toBe('-3');
        });
      });
    });
  });

  it('should destroy horizontal slider and tooltip when element is removed', function () {
    spyOn(this.view, '_destroySlider');
    spyOn(this.view, '_removeTooltip');

    this.view.remove();

    expect(this.view._destroySlider).toHaveBeenCalled();
    expect(this.view._removeTooltip).toHaveBeenCalled();
  });

  describe('with help', function () {
    var view;

    beforeEach(function () {
      view = createViewFn({
        editorAttrs: {
          help: 'help'
        }
      });
    });

    describe('.render', function () {
      it('should render properly', function () {
        view.render();

        expect(view.$('.js-help').attr('data-tooltip')).toContain('help');
      });
    });

    describe('._removeTooltip', function () {
      it('should destroy tooltip', function () {
        spyOn(view._helpTooltip, 'clean');

        view._removeTooltip();

        expect(view._helpTooltip.clean).toHaveBeenCalled();
      });
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
