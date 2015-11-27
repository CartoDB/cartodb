var $ = require('jquery');
var _ = require('underscore');
var Model = require('cdb/core/model');
var View = require('cdb/core/view');
var AnimateValues = require('cdb/geo/ui/widgets/animate_values');

describe('geo/ui/widgets/animate_values', function() {

  beforeEach(function() {
    this.$el = $('<div><div class="js-value">123</div></div>');

    this.model = new Model({ value: 123 });

    this.animator = new AnimateValues({
      el: this.$el
    });
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  it('should animate from two values', function(done) {
    jasmine.clock().install();

    var template = _.template("<%- value %>");

    this.animator.animateFromValues(10, 20, '.js-value', template, { animationSpeed: 10 });

    var self = this;

    setTimeout(function () {
      expect(self.$el.find('.js-value').text()).toBe('20');
      done();
    }, 4000);

    jasmine.clock().tick(4000);
  });

  it('should animate from current value', function(done) {
    jasmine.clock().install();
    var template = _.template("<%- value %>");

    expect(this.$el.find('.js-value').text()).toBe('123');

    this.animator.animateFromCurrentValue(40, '.js-value', template, { animationSpeed: 10 });

    var self = this;

    setTimeout(function () {
      expect(self.$el.find('.js-value').text()).toBe('40');
      done();
    }, 4000);

    jasmine.clock().tick(4000);
  });

  it('should animate from model values', function(done) {
    jasmine.clock().install();
    var template = _.template("<%- value %>");

    this.model.set({ value: 34 });

    this.animator.animateValue(this.model, 'value', '.js-value', template, { animationSpeed: 10 });

    expect(this.$el.find('.js-value').text()).toBe('123');

    var self = this;
    setTimeout(function () {
      expect(self.$el.find('.js-value').text()).toBe('34');
      done();
    }, 4000);

    jasmine.clock().tick(4000);
  });
});
