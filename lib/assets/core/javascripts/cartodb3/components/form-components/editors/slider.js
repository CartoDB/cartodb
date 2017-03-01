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
    direction: '',
    labels: [0, 5, 10]
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
        direction: this.options.direction,
        value: this.value
      })
    );

    var step = this._getStepPercentage();
    this._ticks = this._getTicks(step);

    this.$('.js-slider').slider({
      range: 'min',
      value: this._ticks[this.value],
      step: step,
      orientation: 'horizontal',
      disabled: this.options.disabled,
      slide: this._onSlideChange.bind(this),
      stop: this._onSlideStop.bind(this)
    });

    this._addTicks(step);
    this._updateUI(this.value);
  },

  _updateUI: function (value) {
    if (!value) {
      value = 0;
    }

    this._updateLabel(value);
    this._highlightTick(value);
  },

  _getTickIndex: function () {
    var v = 0;

    if (this.value) {
      v = +this.value.toFixed(2);
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
    this.$('.js-label').text(this._labels[tickID]);
  },

  _getTicks: function (step) {
    return [0].concat(_(this._labels.length - 1).times(function (n) {
      return +(step * (n + 1)).toFixed(2);
    }));
  },

  _getStepPercentage: function () {
    return (100 / (this._labels.length - 1));
  },

  _onSlideChange: function (ev, ui) {
    this.value = ui.value;

    this._updateUI(this._getTickIndex());
  },

  _onSlideStop: function (ev, ui) {
    this.trigger('change', this);
  },

  _hasSlider: function () {
    return this.$('.js-slider').data('ui-slider');
  },

  getValue: function () {
    var value = this._values ? this._values[this._getTickIndex()] : this._getTickIndex();
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
