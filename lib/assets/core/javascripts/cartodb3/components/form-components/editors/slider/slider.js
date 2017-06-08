var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var EditorHelpers = require('../editor-helpers-extend');
var template = require('./slider.tpl');

var TICKS_PLACEHOLDER = 5;
var HANDLE_WIDTH = 12;
var DIMENSION = 160;
var INITIAL = {
  HIGHEST: 'highest',
  LOWEST: 'lowest'
};

Backbone.Form.editors.Slider = Backbone.Form.editors.Base.extend({

  className: 'rangeslider--no-fill',

  options: {
    direction: 'horizontal',
    initial: INITIAL.LOWEST
  },

  events: {
    'change .js-slider': '_onValueChange',
    focus: function () {
      this.trigger('focus', this);
    },
    blur: function () {
      this.trigger('blur', this);
    }
  },

  initialize: function (opts) {
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    EditorHelpers.setOptions(this, opts);

    if (!this.options.labels) {
      throw new Error('labels is required');
    }

    if (this.options.values && this.options.labels.length !== this.options.values.length) {
      throw new Error('values and labels should have the same length');
    }

    this._onValueChange = this._onValueChange.bind(this);
    this._onSlideChange = this._onSlideChange.bind(this);

    this._values = this.options.values;
    this._labels = this.options.labels;
    this._getInitialTickID();

    this._initViews();
  },

  _initViews: function () {
    var isDisabled = this.options.disabled || this._labels.length <= 0;
    var max = this._labels.length === 0 ? TICKS_PLACEHOLDER - 1 : this._labels.length - 1;

    var step = this._getStepPercentage();

    this.$el.html(
      template({
        orientation: this.options.direction,
        disabled: isDisabled,
        min: 0,
        max: max,
        value: this.rangeIndex
      })
    );

    this.$('.js-slider').rangeslider({
      polyfill: false,
      fillClass: 'rangesliderFill',
      handleClass: 'rangesliderHandle',
      onSlide: this._onSlideChange
    });

    this._addTicks(step);
    this._updateUI();
  },

  _getInitialTickID: function () {
    var value = this.value;

    if (this._values && this._values.length > 0) {
      value = this._values.indexOf(this.value);

      if (value === -1) {
        value = this.options.initial === INITIAL.LOWEST ? 0 : this._values.length - 1;
      }
    } else {
      if (this._labels.length === 0) {
        // placeholder ticks with 5 steps [0...4]
        value = 2;
      } else {
        value = 0;
      }
    }

    this.rangeIndex = value;
  },

  _updateUI: function () {
    this._updateLabel(this.rangeIndex);
    this._highlightTick(this.rangeIndex);
  },

  _addTicks: function (step) {
    var offset = HANDLE_WIDTH / 2;
    var ticks = this._labels.length > 0 ? this._labels.length : TICKS_PLACEHOLDER;
    _.each(_.range(ticks), function (tick, index) {
      $('<div class="rangeslider-tick js-tick"></div>')
        .css('left', (step * index + offset) + 'px')
        .appendTo(this.$('.js-ticks'));
    }, this);
  },

  _highlightTick: function (tickID) {
    if (this._values.length > 0) {
      this.$('.js-tick').removeClass('is-highlighted');
      $(this.$('.js-tick').get(tickID)).addClass('is-highlighted');
    }
  },

  _updateLabel: function (tickID) {
    var label = this._labels[tickID];
    if (this._labels.length <= 0) {
      label = _t('form-components.editors.slide.no-values');
    }
    this.$('.js-label').text(label);
  },

  _getStepPercentage: function () {
    var steps = this._getSteps();
    var rangeWidth = DIMENSION - HANDLE_WIDTH;

    return (rangeWidth / steps);
  },

  _getSteps: function () {
    var steps = this._labels.length - 1;
    if (steps < 0) {
      steps = TICKS_PLACEHOLDER - 1;
    }

    return steps;
  },

  _onValueChange: function (e) {
    var value = this.$('.js-slider').val();
    this._onSlideChange(null, value);
    this.trigger('change', this);
  },

  _onSlideChange: function (position, value) {
    this.rangeIndex = +value;
    this.value = this._values ? this._values[this.rangeIndex] : this.rangeIndex;
    this._updateUI(this.rangeIndex);
  },

  getValue: function () {
    var value = this._values ? this._values[this.rangeIndex] : this.rangeIndex;
    return (this.value === '') ? null : value;
  },

  setValue: function (value) {
    var index = this._values ? this._values.indexOf(value) : value;
    this.$('.js-slider').val(index).change();
    this.value = value;
  },

  _destroySlider: function () {
    this.$('.js-slider').off('change', this._onValueChange);
    this.$('.js-slider').rangeslider('destroy');
  },

  remove: function () {
    this._destroySlider();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
