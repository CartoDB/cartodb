var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/slider');

describe('components/form-components/editors/slider', function () {
  beforeEach(function () {
    this.labels = ['Huckepack', 'Naseweis', 'Packe', 'Pick', 'Puck', 'Purzelbaum', 'Rumpelbold'];
    this.values = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

    this.view = new Backbone.Form.editors.Slider({
      labels: this.labels,
      schema: {}
    });

    this.viewWithValues = new Backbone.Form.editors.Slider({
      labels: this.labels,
      values: this.values,
      value: 'f',
      schema: {}
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-slider').length).toBe(1);
    expect(this.view.$('.js-tick').length).toBe(this.labels.length);
    expect(this.view.$('.js-label').text()).toBe('Huckepack');
    expect($(this.view.$('.js-tick').get(0)).hasClass('is-highlighted')).toBeTruthy();

    expect(this.viewWithValues.$('.js-slider').length).toBe(1);
    expect(this.viewWithValues.$('.js-tick').length).toBe(this.labels.length);
    expect(this.viewWithValues.$('.js-label').text()).toBe('Purzelbaum');
    expect($(this.viewWithValues.$('.js-tick').get(5)).hasClass('is-highlighted')).toBeTruthy();
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
          $slider.slider('option', 'slide').call($slider, {}, { value: 50 });
          $slider.slider('option', 'stop').call($slider);

          var $sliderWithValues = this.viewWithValues.$('.js-slider');
          $sliderWithValues.slider('option', 'slide').call($sliderWithValues, {}, { value: 50 });
          $sliderWithValues.slider('option', 'stop').call($sliderWithValues);
        });

        it('should trigger change', function () {
          expect(this.onChanged).toHaveBeenCalled();
        });

        it('should update label', function () {
          expect(this.view.$('.js-label').text()).toBe('Pick');
          expect(this.viewWithValues.$('.js-label').text()).toBe('Pick');
        });

        it('should highlight tick', function () {
          expect($(this.view.$('.js-tick').get(3)).hasClass('is-highlighted')).toBeTruthy();
          expect($(this.viewWithValues.$('.js-tick').get(3)).hasClass('is-highlighted')).toBeTruthy();
        });

        it('should return value', function () {
          expect(this.view.getValue()).toBe(3);
          expect(this.viewWithValues.getValue()).toBe('d');
        });
      });
    });

    describe('exceptions', function () {
      it('should throw exception when the values and labels differ', function () {
        var wrapper = function () {
          new Backbone.Form.editors.Slider({ // eslint-disable-line no-new
            values: [1, 2, 3, 4],
            labels: ['a', 'b'],
            schema: {}
          });
        };
        expect(wrapper).toThrow();
      });

      it('should throw exception when there are no labels', function () {
        var wrapper = function () {
          new Backbone.Form.editors.Slider({ // eslint-disable-line no-new
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
