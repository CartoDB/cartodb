var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var ImageLoaderView = require('builder/components/img-loader-view');
var template = require('./input-color-picker-header.tpl');
var MAX = 1;

module.exports = CoreView.extend({
  events: {
    'click .js-color': '_onClickColor',
    'click .js-assetPicker': '_onClickAssetPicker',
    'keyup .js-a': '_onChangeOpacity'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function (model, options) {
    if (model && model.changed && typeof model.changed.opacity !== 'undefined') {
      this._reRenderOpacity();
      return this;
    }

    this.clearSubViews();
    this.$el.empty();

    var rampItem = this._getRampItem();
    this.$el.append(template({
      ramp: this.model.get('ramp'),
      index: this.model.get('index'),
      opacity: this.model.get('opacity'),
      label: rampItem.title || _t('form-components.editors.fill.input-qualitative-ramps.others'),
      color: rampItem.color || '',
      iconStylingEnabled: this.options.iconStylingEnabled,
      isCategorized: _.has(rampItem, 'image'),
      image: rampItem.image || '',
      imageEnabled: this.options.imageEnabled
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

    this._loadImages();

    return this;
  },

  _getRampItem: function () {
    var ramp = this.model.get('ramp');

    if (!ramp) {
      return {
        color: '',
        title: _t('form-components.editors.fill.input-qualitative-ramps.others'),
        image: ''
      };
    }

    return ramp[this.model.get('index')];
  },

  _loadImages: function () {
    var rampItem = this._getRampItem();

    this.iconView = new ImageLoaderView({
      imageClass: 'CDB-Text u-actionTextColor js-assetPicker',
      imageUrl: rampItem.image,
      color: rampItem.color
    });
    this.addView(this.iconView);
    this.$('.js-image-container').append(this.iconView.render().el);
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
