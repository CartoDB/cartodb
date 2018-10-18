var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

describe('components/form-components/editors/slider', function () {
  var labels = ['Huckepack', 'Naseweis', 'Packe', 'Pick', 'Puck', 'Purzelbaum', 'Rumpelbold'];
  var values = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  var createViewFn = function (options) {
    var defaultOptions = {
      labels: labels,
      schema: {}
    };

    var view = new Backbone.Form.editors.Slider(_.extend(defaultOptions, options));
    view.render();
    return view;
  };

  beforeEach(function () {
    this.view = createViewFn();
    this.viewWithValues = createViewFn({
      values: values,
      value: 'f'
    });

    this.view.render();
    this.viewWithValues.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-slider').length).toBe(1);
      expect(this.view.$('.js-tick').length).toBe(labels.length);
      expect(this.view.$('.js-label').text()).toBe('Huckepack');
      expect($(this.view.$('.js-tick').get(0)).hasClass('is-highlighted')).toBeTruthy();

      expect(this.viewWithValues.$('.js-slider').length).toBe(1);
      expect(this.viewWithValues.$('.js-tick').length).toBe(labels.length);
      expect(this.viewWithValues.$('.js-label').text()).toBe('Purzelbaum');
      expect($(this.viewWithValues.$('.js-tick').get(5)).hasClass('is-highlighted')).toBeTruthy();
    });

    it('should display neither the ticks nor the slider when there is only one value', function (done) {
      var self = this;
      this.view._values = ['1'];

      document.body.appendChild(this.view.el);
      this.view.render();

      setTimeout(function () {
        expect(self.view.$('.js-slider').css('display')).toBe('none');
        expect(self.view.$('.js-ticks').css('display')).toBe('none');
        done();
      }, 0);
    });
  });

  describe('data', function () {
    it('should get a value by default', function () {
      expect(this.view.$('.js-label').text()).toBe('Huckepack');
      expect(this.viewWithValues.$('.js-label').text()).toBe('Purzelbaum');
    });

    describe('change value', function () {
      beforeEach(function () {
        this.onChanged = jasmine.createSpy('onChanged');
        this.view.bind('change', this.onChanged);
        this.viewWithValues.bind('change', this.onChanged);
      });

      describe('when slider changes', function () {
        beforeEach(function () {
          var $slider = this.view.$('.js-slider');
          $slider.val(4).change();
          var $sliderWithValues = this.viewWithValues.$('.js-slider');
          $sliderWithValues.val(4).change();
        });

        it('should trigger change', function () {
          expect(this.onChanged).toHaveBeenCalled();
        });

        it('should update label', function () {
          expect(this.view.$('.js-label').text()).toBe('Puck');
          expect(this.viewWithValues.$('.js-label').text()).toBe('Puck');
        });

        it('should highlight tick', function () {
          expect($(this.view.$('.js-tick').get(4)).hasClass('is-highlighted')).toBeTruthy();
          expect($(this.viewWithValues.$('.js-tick').get(4)).hasClass('is-highlighted')).toBeTruthy();
        });

        it('should return value', function () {
          expect(this.view.getValue()).toBe(4);
          expect(this.viewWithValues.getValue()).toBe('e');
        });
      });
    });

    describe('initial selection', function () {
      it('initial value', function () {
        this.view = createViewFn({
          values: [1, 2, 3, 4],
          labels: ['a', 'b', 'c', 'd'],
          schema: {},
          value: 2
        });

        expect(this.view.getValue()).toBe(2);
      });

      it('should start selecting the lowest value by default', function () {
        this.view = createViewFn({
          values: [1, 2, 3, 4],
          labels: ['a', 'b', 'c', 'd'],
          schema: {}
        });

        expect(this.view.getValue()).toBe(1);
      });

      it('should accept option to start selecting the highest value', function () {
        this.view = createViewFn({
          values: [1, 2, 3, 4],
          labels: ['a', 'b', 'c', 'd'],
          initial: 'highest',
          schema: {}
        });

        expect(this.view.getValue()).toBe(4);
      });
    });

    describe('exceptions', function () {
      it('should throw exception when the values and labels differ', function () {
        var wrapper = function () {
          createViewFn({
            values: [1, 2, 3, 4],
            labels: ['a', 'b'],
            schema: {}
          });
        };
        expect(wrapper).toThrow();
      });

      it('should throw exception when there are no labels', function () {
        var wrapper = function () {
          createViewFn({
            values: [1, 2, 3, 4],
            schema: {}
          });
        };
        expect(wrapper).toThrow();
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
    this.viewWithValues.remove();
  });
});
