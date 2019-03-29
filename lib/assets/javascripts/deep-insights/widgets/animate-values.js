var _ = require('underscore');
var d3 = require('d3');
var CoreView = require('backbone/core-view');

/**
 * Animate between two values
 */
module.exports = CoreView.extend({
  animateFromValues: function (from, to, className, template, opts) {
    var $el = this.$(className);
    var options = opts || {};
    var formatter = options.formatter || d3.format('0,000');
    var templateData = options.templateData || {};
    var debounceWait = options.debounceWait || 500;

    var hasDecimals = (to % 1 === 0);

    var stepValue = function (i) {
      i = hasDecimals ? Math.round(i) : i;
      var value = (_.isNaN(i) || i === undefined) ? (options.defaultValue || 0) : formatter(i);
      var data = _.extend({ value: value }, templateData);
      $el.text(template(data));
    };

    if (options.animationSpeed === 0) {
      stepValue(to);
      return;
    }

    stepValue(from);

    var animate = _.debounce(function () {
      $el.prop('counter', from).stop().animate({ counter: to }, {
        duration: options.animationSpeed || 500,
        easing: options.easingMethod || 'swing',
        step: stepValue
      });
    }, debounceWait);

    animate();
  },

  animateFromCurrentValue: function (value, className, template, opts) {
    var $el = this.$(className);

    var options = opts || {};
    var debounceWait = options.debounceWait || 500;

    var to = value;
    var from = +this.$(className).text();

    var formatter = options.formatter || d3.format('0,000');
    var templateData = options.templateData || {};

    var hasDecimals = (to % 1 === 0);

    var stepValue = function (i) {
      i = hasDecimals ? Math.round(i) : i;
      value = (_.isNaN(i) || i === undefined) ? (options.defaultValue || 0) : formatter(i);
      var data = _.extend({ value: value }, templateData);
      $el.text(template(data));
    };

    if (options.animationSpeed === 0) {
      stepValue(to);
      return;
    }

    stepValue(from);

    var animate = _.debounce(function () {
      $el.prop('counter', from).stop().animate({ counter: to }, {
        duration: options.animationSpeed || 500,
        easing: options.easingMethod || 'swing',
        step: stepValue
      });
    }, debounceWait);

    animate();
  },

  animateValue: function (model, what, className, template, opts) {
    var $el = this.$(className);

    var options = opts || {};
    var debounceWait = options.debounceWait || 500;

    var to = model.get(what);
    var from = model.previous(what) || 0;

    var formatter = options.formatter || d3.format('0,000');
    var templateData = options.templateData || {};

    var hasDecimals = (to % 1 === 0);

    var stepValue = function (i) {
      i = hasDecimals ? Math.round(i) : i;
      var value = (_.isNaN(i) || i === undefined) ? (options.defaultValue || 0) : formatter(i);
      var data = _.extend({ value: value }, templateData);
      $el.text(template(data));
    };

    if (options.animationSpeed === 0) {
      stepValue(to);
      return;
    }

    stepValue(from);

    var animate = _.debounce(function () {
      $el.prop('counter', from).stop().animate({ counter: to }, {
        duration: options.animationSpeed || 500,
        easing: options.easingMethod || 'swing',
        step: stepValue
      });
    }, debounceWait);

    animate();
  }
});
