var Backbone = require('backbone');
var template = require('./number.tpl');
var _ = require('underscore');
require('jquery');
require('jquery-ui');
require('tagit');

Backbone.Form.editors.Taglist = Backbone.Form.editors.Base.extend({
  className: 'Form-tags',

  initialize: function (opts) {
    this.options = _.extend(
      {},
      this.options,
      opts.schema.options
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
