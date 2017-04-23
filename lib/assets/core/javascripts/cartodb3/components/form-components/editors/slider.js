var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var template = require('./slider.tpl');
require('jquery');
require('jquery-ui');

Backbone.Form.editors.Slider = Backbone.Form.editors.Base.extend({

  tagName: 'ul',
  className: 'CDB-OptionInput-container CDB-OptionInput-container--noMargin',

  options: {
    direction: ''
  },

  events: {
    focus: function () {
      this.trigger('focus', this);
    },
    blur: function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);

    this._setOptions(opts);

    if (!this.options.labels) {
      throw new Error('labels is required');
    }

    if (this.options.values && this.options.labels.length !== this.options.values.length) {
      throw new Error('values and labels should have the same length');
    }

    this._values = this.options.values;
    this._labels = this.options.labels;

    this._initViews();
  },

  _initViews: function () {
    this.$el.html(
      template({
        direction: this.options.direction
      })
    );

    var isDisabled = this.options.disabled || this._labels.length <= 0;
    var step = this._getStepPercentage();
    this._ticks = this._getTicks(step);

    var tickID = this._getInitialTickID();

    this.$('.js-slider').slider({
      range: 'min',
      value: this._ticks[tickID],
      step: step,
      orientation: 'horizontal',
      disabled: isDisabled,
      slide: this._onSlideChange.bind(this),
      stop: this._onSlideStop.bind(this)
    });

    this._addTicks(step);
    this._updateUI(tickID);
  },

  _getInitialTickID: function () {
    var value = this.value;

    if (this._values && this._values.length > 0) {
      value = this._values.indexOf(this.value);

      if (value === -1) {
        value = 0;
      }
    } else if (!value) {
      if (this._labels.length === 0) {
        // placeholder ticks with 5 steps [0...4]
        value = 2;
      } else {
        value = 0;
      }
    }

    return value;
  },

  _updateUI: function (tickID) {
    if (tickID === undefined) {
      tickID = 0;
    }

    this._updateLabel(tickID);
    this._highlightTick(tickID);
  },

  _getTickID: function () {
    var v = 0;

    if (this.value && _.isNumber(this.value)) {
      v = this._calculateTickValue(this.value);
    }

    return this._ticks.indexOf(v);
  },

  _addTicks: function (step) {
    _.each(this._ticks, function (amount) {
      $('<div class="UISlider-tick js-tick"></div>')
        .css('left', amount + '%')
        .appendTo(this.$('.js-slider'));
    }, this);
  },

  _highlightTick: function (tickID) {
    this.$('.js-tick').removeClass('is-highlighted');
    $(this.$('.js-tick').get(tickID)).addClass('is-highlighted');
  },

  _updateLabel: function (tickID) {
    var label = this._labels[tickID];
    if (this._labels.length <= 0) {
      label = _t('form-components.editors.slide.no-values');
    }
    this.$('.js-label').text(label);
  },

  _getTicks: function (step) {
    var self = this;
    var steps = this._labels.length - 1;
    if (steps < 0) {
      steps = 4;
    }

    return [0].concat(_(steps).times(function (n) {
      return self._calculateTickValue(step * (n + 1));
    }));
  },

  _getStepPercentage: function () {
    var steps = this._labels.length - 1;
    if (steps < 0) {
      steps = 4;
    }
    return (100 / steps);
  },

  _calculateTickValue: function (value) {
    return +value.toFixed(2);
  },

  _onSlideChange: function (ev, ui) {
    this.value = ui.value;

    this._updateUI(this._getTickID());
  },

  _onSlideStop: function (ev, ui) {
    this.trigger('change', this);
  },

  _hasSlider: function () {
    return this.$('.js-slider').data('ui-slider');
  },

  getValue: function () {
    var value = this._values ? this._values[this._getTickID()] : this._getTickID();
    return (this.value === '') ? null : value;
  },

  setValue: function (value) {
    this.$('.js-slider').slider('value', value);
    this.value = value;
  },

  _destroySlider: function () {
    if (this._hasSlider()) {
      this.$('.js-slider').slider('destroy');
    }
  },

  remove: function () {
    this._destroySlider();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
