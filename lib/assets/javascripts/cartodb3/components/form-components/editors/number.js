var Backbone = require('backbone');
var template = require('./number.tpl');
var _ = require('underscore');
require('jquery');
require('jquery-ui/slider');

var TAB_KEY_CODE = 9;
var LEFT_ARROW_KEY_CODE = 37;
var RIGHT_ARROW_KEY_CODE = 39;
var NUMBER_NINE_KEY_CODE = 57;
var POINT_KEY_CODE = 190;
var SPACE_KEY_CODE = 32;
var ENTER_KEY_CODE = 13;

Backbone.Form.editors.Number = Backbone.Form.editors.Base.extend({

  tagName: 'ul',
  className: 'CDB-OptionInput-container CDB-OptionInput-container--noMargin',

  options: {
    min: 0,
    max: 10,
    step: 1
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
    this.options = _.extend(
      {},
      this.options,
      opts.schema.options,
      opts.schema.validators && opts.schema.validators[1]
    );
    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    this._initViews();
  },

  _initViews: function () {
    this.$el.html(
      template({
        value: this.value
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
      stop: this._onSlideStop.bind(this)
    });
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
      if (e.which > NUMBER_NINE_KEY_CODE && e.which !== POINT_KEY_CODE) {
        return false;
      }
      if (e.which === SPACE_KEY_CODE) {
        return false;
      }
      if (e.which === ENTER_KEY_CODE) {
        return false;
      }
    }
  },

  _onInputKeyUp: function () {
    var value = this.$('.js-input').val();
    var isFloatNotCompleted = new RegExp(/\d+\.$/);
    var isDifferent = parseFloat(value) !== parseFloat(this.value);
    if (!isFloatNotCompleted.test(value) && isDifferent) {
      this.$('.js-slider').slider('value', value);
      this.value = value;
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
  },

  getValue: function () {
    return this.$('.js-input').val();
  },

  setValue: function (value) {
    this.$('.js-slider').slider('value', value);
    this.$('.js-input').val(value);
    this.value = value;
  },

  _destroySlider: function () {
    if (this.$('.js-slider').data('ui-slider')) {
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
