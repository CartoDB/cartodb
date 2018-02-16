var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var template = require('./number.tpl');
var EditorHelpers = require('builder/components/form-components/editors/editor-helpers-extend');
require('jquery');
require('jquery-ui');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

var UP_ARROW_KEY_CODE = 38;
var BOTTOM_ARROW_KEY_CODE = 40;
var SPACE_KEY_CODE = 32;
var ENTER_KEY_CODE = 13;

var SMALL_INCREMENT = 1;
var BIG_INCREMENT = 10;

Backbone.Form.editors.Number = Backbone.Form.editors.Base.extend({

  tagName: 'ul',
  className: 'CDB-OptionInput-container CDB-OptionInput-container--noMargin u-grow',

  // backbone-forms 0.14.1 has a 'number' validator:
  // https://github.com/powmedia/backbone-forms/blob/v0.14.1/src/validators.js#L64
  // We're on 0.14.0 so we have to use a 'regexp' validator
  options: {
    min: 0,
    max: 10,
    step: 1,
    showSlider: true,
    validators: [{
      type: 'regexp',
      regexp: /^[+-]?((\.\d+)|(\d+(\.\d+)?))$/,
      message: _t('editor.edit-feature.valid')
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
    EditorHelpers.setOptions(this, opts);

    // Setting min, max and step from validators, if exists.
    this._validators = opts.validators || (opts.schema && opts.schema.validators);
    if (this._validators && this._validators[1]) {
      this.options.min = this._validators[1].min;
      this.options.max = this._validators[1].max;
      this.options.step = this._validators[1].step;
    }

    if (this.options.editorAttrs && this.options.editorAttrs.help) {
      this._help = this.options.editorAttrs.help;
    }

    this._debouncedTriggerChange = _.debounce(this._triggerChange, 333).bind(this);

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
        placeholder: placeholder,
        help: this._help || ''
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
    }

    if (this._help) {
      this._removeTooltip();

      this._helpTooltip = new TipsyTooltipView({
        el: this.$('.js-help'),
        gravity: 'w',
        title: function () {
          return $(this).data('tooltip');
        }
      });
    }

    this.$el.toggleClass('CDB-OptionInput-container--noSlider', !!this.options.showSlider);
  },

  _onSlideChange: function (ev, ui) {
    this.value = ui.value;
    this.$('.js-input').val(this.value);
  },

  _onSlideStop: function (ev, ui) {
    this._debouncedTriggerChange();
  },

  _onInputKeyDown: function (event) {
    var $input = this.$('.js-input');
    var value = +this.getValue();
    var increment = event.shiftKey === true ? BIG_INCREMENT : SMALL_INCREMENT;

    switch (event.which) {
      case SPACE_KEY_CODE:
      case ENTER_KEY_CODE:
        return false;
      case UP_ARROW_KEY_CODE:
        value = this._nextValue(value, increment);
        $input.val(value);
        break;
      case BOTTOM_ARROW_KEY_CODE:
        value = this._nextValue(value, increment * -1);
        $input.val(value);
        break;
      default:
        // Any other case!
    }
  },

  _nextValue: function (value, increment) {
    var nextValue = value += increment;

    if (nextValue < this.options.min) return this.options.min;
    if (nextValue > this.options.max) return this.options.max;

    return nextValue;
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
    this._debouncedTriggerChange();
  },

  _triggerChange: function () {
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
    var val = this.$('.js-input').val();

    return (val === '') ? null : +val;
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

  _removeTooltip: function () {
    if (this._helpTooltip) {
      this._helpTooltip.clean();
    }
  },

  remove: function () {
    this._destroySlider();
    this._removeTooltip();

    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
