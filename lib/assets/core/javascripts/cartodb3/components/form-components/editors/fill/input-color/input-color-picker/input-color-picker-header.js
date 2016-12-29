var $ = require('jquery');
var ImageLoaderView = require('../../../../../img-loader-view');
var template = require('./input-color-picker-header.tpl');
var MAX = 1;

module.exports = ImageLoaderView.extend({
  events: {
    'click .js-color': '_onClickColor',
    'click .js-assetPicker': '_onClickAssetPicker',
    'keyup .js-a': '_onChangeOpacity'
  },

  initialize: function (opts) {
    this._initBinds();

    ImageLoaderView.prototype.initialize.call(this, {
      imageClass: 'CDB-Text u-actionTextColor js-assetPicker'
    });
  },

  render: function (model, options) {
    if (model && model.changed && typeof model.changed.opacity !== 'undefined') {
      this._reRenderOpacity();
      return this;
    }

    this.clearSubViews();
    this.$el.empty();

    this.$el.append(template({
      ramp: this.model.get('ramp'),
      index: this.model.get('index'),
      opacity: this.model.get('opacity'),
      label: this._getRampItem().title || _t('form-components.editors.fill.input-categories.others'),
      color: this._getRampItem().color,
      image: this._getRampItem().image
    }));

    this._slider = this.$('.js-slider').slider({
      range: 'min',
      value: this._inverseSliderValue(this.model.get('opacity')),
      min: 0,
      max: MAX,
      step: 0.02,
      orientation: 'horizontal',
      disabled: false,
      slide: this._onSlideChange.bind(this)
    });

    this._loadImage(this._getRampItem().image, this._getRampItem().color);

    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _getRampItem: function () {
    var ramp = this.model.get('ramp');
    return ramp[this.model.get('index')];
  },

  _onClickColor: function (ev) {
    this.killEvent(ev);
    this.model.set('index', $(ev.target).index());
  },

  _onClickBack: function (ev) {
    this.killEvent(ev);
    this.trigger('back', this);
  },

  _onClickAssetPicker: function (ev) {
    this.killEvent(ev);
    this.trigger('goToAssetPicker', this);
  },

  _onSlideChange: function (evt, obj) {
    this.model.set('opacity', this._inverseSliderValue(obj.value));
  },

  _inverseSliderValue: function (value) {
    return parseFloat(Number(MAX - value).toFixed(2));
  },

  _onChangeOpacity: function () {
    var $input = this.$('.js-a');
    var value = $input.val();
    var isValid = this._isValidOpacity(value);
    $input.toggleClass('has-error', !isValid);
    if (isValid) {
      this.model.set('opacity', parseFloat(value));
    }
  },

  _isValidOpacity: function (value) {
    var regex = /^((0(\.\d+)?)|(1(\.0)?))$/;
    return regex.test(value);
  },

  _reRenderOpacity: function () {
    var $input = this.$('.js-a');
    var $slider = this.$('.js-slider');
    var opacity = this.model.get('opacity');
    var inputValue;
    var sliderValue;

    if ($input.length > 0) {
      inputValue = $input.val();
      if (!this._isValidOpacity(inputValue) || (this._isValidOpacity(inputValue) && parseFloat(inputValue) !== opacity)) {
        $input.val(opacity);
      }
    }

    if (typeof $slider.slider('instance') !== 'undefined') {
      sliderValue = $slider.slider('value');
      if (typeof sliderValue !== 'undefined' && sliderValue !== this._inverseSliderValue(opacity)) {
        $slider.slider('value', this._inverseSliderValue(opacity));
      }
    }
  }
});
