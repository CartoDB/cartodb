var cdb = require('cartodb.js');
require('colorpicker');
var template = require('./color-picker.tpl');

module.exports = cdb.core.View.extend({
  className: 'CDB-ColorPicker',

  _COLORS: [
    '#136400', '#229A00', '#B81609', '#D6301D',
    '#F84F40', '#41006D', '#7B00B4', '#A53ED5', '#2E5387', '#3E7BB6',
    '#5CA2D1', '#FF6600', '#FF9900', '#FFCC00', '#FFFFFF',
    '#012700', '#055D00', '#850200', '#B40903', '#F11810',
    '#11002F', '#3B007F', '#6B0FB2', '#081B47', '#0F3B82', '#2167AB',
    '#FF2900', '#FF5C00', '#FFA300', '#000000'
  ],

  initialize: function (opts) {
    this.model = new cdb.core.Model({
      hex: opts.value
    });

    this._initBinds();
  },

  render: function () {
    this.$el.html(template());

    ColorPicker.fixIndicators(
      this.$('.js-sliderIndicator').get(0),
      this.$('.js-pickerIndicator').get(0)
    );

    this.color_picker = ColorPicker(
      this.$('.js-slider').get(0),
      this.$('.js-picker').get(0),
      this._setPicker.bind(this));
      return this;
  },

  _initBinds: function () {
    this.model.bind('change:hex', this._onChangeColor, this);
    this.model.bind('change:r', this._onChangeColor, this);
    this.model.bind('change:g', this._onChangeColor, this);
    this.model.bind('change:b', this._onChangeColor, this);
    this.model.bind('change:a', this._onChangeColor, this);
  },

  _onChangeColor: function () {
    this.$('.js-preview').css({ 'background-color': this.model.get('hex') });
    this.trigger('change', this.model.get('hex'));

    this.$('.js-hex').val(this.model.get('hex'));
    this.$('.js-r').val(this.model.get('r'));
    this.$('.js-g').val(this.model.get('g'));
    this.$('.js-b').val(this.model.get('b'));
    this.$('.js-a').val(this.model.get('a'));
  },

  _setPicker: function (hex, hsv, rgb, mousePicker, mouseSlide) {
    this.model.set({ hex: hex, r: rgb.r, g: rgb.g, b: rgb.b, a: 100 });

    ColorPicker.positionIndicators(
      this.$('.js-sliderIndicator').get(0),
      this.$('.js-pickerIndicator').get(0),
      mouseSlide, mousePicker
    );
  }
});
