var Backbone = require('backbone');
var template = require('./range-number.tpl');
var _ = require('underscore');
var $ = require('jquery');
require('jquery-ui/slider');

Backbone.Form.editors.RangeNumber = Backbone.Form.editors.Base.extend({

  tagName: 'div',
  className: 'CDB-OptionInput-container',

  options: {
    min: 0,
    max: 10,
    step: 1
  },

  events: {
    'change .js-input': '_onInputChange',
    'focus': function () {
      // The 'focus' event should be triggered whenever an input within
      // this editor becomes the `document.activeElement`.
      this.trigger('focus', this);
      // This call automatically sets `this.hasFocus` to `true`.
    },
    'blur': function () {
      // The 'blur' event should be triggered whenever an input within
      // this editor stops being the `document.activeElement`.
      this.trigger('blur', this);
      // This call automatically sets `this.hasFocus` to `false`.
    }
  },

  initialize: function (opts) {
    this.options = _.extend(this.options, opts.schema.options);
    // Call parent constructor
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    this._initViews();
  },

  render: function () {
    this.setValue(this.value);
    return this;
  },

  _initViews: function () {
    this.$el.html(
      template({
        value: this.value,
        min: this.options.min,
        max: this.options.max,
        step: this.options.step
      })
    );

    this.$('.js-slider').slider({
      range: 'min',
      value: this.value,
      min: this.options.min,
      max: this.options.max,
      step: this.options.step,
      orientation: 'horizontal',
      slide: this._onSlideChange.bind(this),
      stop: this._onSlideStop.bind(this),
      change: this._onSlideChange.bind(this)
    });
  },

  _onSlideChange: function (ev, ui) {
    this.$('.js-input').val(ui.value);
  },

  _onSlideStop: function (ev, ui) {
    this.trigger('change', this);
  },

  getValue: function () {
    return this.$('.js-slider').slider('value');
  },

  setValue: function (value) {
    this.$('.js-slider').slider('value', value);
    this.$('.js-input').val(value);
    this.value = value;
  },

  _onInputChange: function () {
    if (this.validate()) {
      this.trigger('change', this);
    }
  },

  focus: function () {
    if (this.hasFocus) return;
    this.$('.js-input').focus();
  },

  blur: function () {
    if (!this.hasFocus) return;
    this.$('.js-input').blur();
  }
});
