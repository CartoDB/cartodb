var $ = require('jquery');
var _ = require('underscore');
var cdb = require('internal-carto.js');
var AnimateValues = require('../../../../javascripts/deep-insights/widgets/animate-values');

describe('widgets/animate-values', function () {
  beforeEach(function () {
    this.$el = $('<div><div class="js-value">123</div></div>');

    this.model = new cdb.core.Model({ value: 123 });

    this.animator = new AnimateValues({
      el: this.$el
    });
  });

  it('should animate from two values', function () {
    var template = _.template('<%- value %>');

    this.animator.animateFromValues(10, 20, '.js-value', template, { animationSpeed: 0 });

    expect(this.$el.find('.js-value').text()).toBe('20');
  });

  it('should animate from current value', function () {
    var template = _.template('<%- value %>');

    expect(this.$el.find('.js-value').text()).toBe('123');

    this.animator.animateFromCurrentValue(40, '.js-value', template, { animationSpeed: 0 });

    expect(this.$el.find('.js-value').text()).toBe('40');
  });

  it('should animate from model values', function () {
    var template = _.template('<%- value %>');

    this.model.set({ value: 34 });

    this.animator.animateValue(this.model, 'value', '.js-value', template, { animationSpeed: 0 });

    expect(this.$el.find('.js-value').text()).toBe('34');
  });
});
