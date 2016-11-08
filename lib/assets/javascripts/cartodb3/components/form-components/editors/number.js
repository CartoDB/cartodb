var Backbone = require('backbone');
var template = require('./number.tpl');
require('jquery');
require('jquery-ui');

var TAB_KEY_CODE = 9;
var LEFT_ARROW_KEY_CODE = 37;
var RIGHT_ARROW_KEY_CODE = 39;
var SPACE_KEY_CODE = 32;
var ENTER_KEY_CODE = 13;

Backbone.Form.editors.Number = Backbone.Form.editors.Base.extend({

  tagName: 'ul',
  className: 'CDB-OptionInput-container CDB-OptionInput-container--noMargin',

  // backbone-forms 0.14.1 has a 'number' validator:
  // https://github.com/powmedia/backbone-forms/blob/v0.14.1/src/validators.js#L64
  // We're on 0.14.0 so we have to use a 'regexp' validator
  options: {
    min: 0,
    max: 10,
    step: 1,
    showSlider: true,
    validators: [{
      type: 'regexp', // backbone-forms 0.14.1 has a 'number' validator
      regexp: /^[0-9]*\.?[0-9]*$/,
      message: 'Must be valid'
    }]
  },

  events: {
    'keydown .js-input': '_onInputKeyDown',
    'keyup .js-input': '_onInputKeyUp',
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

    // Setting min, max and step from validators, if exists.
    this._validators = opts.validators || (opts.schema && opts.schema.validators);
    if (this._validators && this._validators[1]) {
      this.options.min = this._validators[1].min;
      this.options.max = this._validators[1].max;
      this.options.step = this._validators[1].step;
    }

    this._initViews();
  },

  _initViews: function () {
    var placeholder = (this.value === null) ? 'null' : '';

    this.$el.html(
      template({
        value: this.value,
        isDisabled: this.options.disabled,
        hasSlider: this.options.showSlider,
        isFormatted: this.options.isFormatted,
        placeholder: placeholder
      })
    );

    if (this.options.showSlider) {
      this.$('.js-slider').slider({
        range: 'min',
        value: this.value,
        min: this.options.min,
        max: this.options.max,
        step: this.options.step,
        orientation: 'horizontal',
        disabled: this.options.disabled,
        slide: this._onSlideChange.bind(this),
        stop: this._onSlideStop.bind(this)
      });
    } else {
      this.$el.addClass('CDB-OptionInput-container--noSlider');
    }
  },

  _onSlideChange: function (ev, ui) {
    this.value = ui.value;
    this.$('.js-input').val(this.value);
  },

  _onSlideStop: function (ev, ui) {
    this.trigger('change', this);
  },

  _onInputKeyDown: function (e) {
    if (e.shiftKey === true) {
      if (e.which !== TAB_KEY_CODE && e.which !== LEFT_ARROW_KEY_CODE && e.which !== RIGHT_ARROW_KEY_CODE) {
        return false;
      }
    } else {
      if (e.which === SPACE_KEY_CODE) {
        return false;
      }
      if (e.which === ENTER_KEY_CODE) {
        return false;
      }
    }
  },

  _hasSlider: function () {
    return this.options.showSlider && this.$('.js-slider').data('ui-slider');
  },

  _onInputKeyUp: function () {
    var value = this.$('.js-input').val();
    if (this._hasSlider()) {
      this.$('.js-slider').slider('value', value);
    }

    this.value = value;
    this.trigger('change', this);
  },

  focus: function () {
    if (this.hasFocus) return;
    this.$('.js-input').focus();
  },

  blur: function () {
    if (!this.hasFocus) return;
    this.$('.js-input').blur();
  },

  getValue: function () {
    return this.$('.js-input').val();
  },

  setValue: function (value) {
    if (this._hasSlider()) {
      this.$('.js-slider').slider('value', value);
    }

    this.$('.js-input').val(value);
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
