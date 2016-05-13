var cdb = require('cartodb.js');
require('bootstrap-colorpicker');
var template = require('./template.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    this.model = new cdb.core.Model({
      hex: opts.value
    });

    this._initBinds();
  },

  render: function () {
    this.$el.append(template());
    this.$('.js-colorPicker').colorpicker({
      color: this.model.get('hex'),
      container: true,
      horizontal: true,
      inline: true,
      customClass: 'ColorPicker',
      template: '<div class="colorpicker dropdown-menu">' +
        '<div class="colorpicker-saturation"><i><b></b></i></div>' +
          '<div class="colorpicker-hue"><i class="ColorPicker-ball"></i></div>' +
            '<div class="colorpicker-alpha js-alpha"><i class="ColorPicker-ball"></i></div>' +
              '<div class="ColorPicker-color colorpicker-color js-color"></div>' +
                  '</div>',
      slidersHorz: {
        saturation: {
          maxLeft: 218,
          maxTop: 105,
          callLeft: 'setSaturation',
          callTop: 'setBrightness'
        },
        hue: {
          maxLeft: 180,
          maxTop: 0,
          callLeft: 'setHue',
          callTop: false
        },
        alpha: {
          maxLeft: 180,
          maxTop: 0,
          callLeft: 'setAlpha',
          callTop: false
        }
      }
    });

    var self = this;

    this.$('.js-colorPicker').colorpicker().on('changeColor', function (e) {
      var rgb = e.color.toRGB();
      var hex = e.color.toHex();
      self.model.set({ hex: hex, r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a });
      self.$('.js-color').css('opacity', rgb.a);
    });

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
    this.trigger('change', this.model.get('hex'));

    this.$('.js-hex').val(this.model.get('hex').substr(1));
    this.$('.js-r').val(this.model.get('r'));
    this.$('.js-g').val(this.model.get('g'));
    this.$('.js-b').val(this.model.get('b'));
    this.$('.js-a').val(this.model.get('a'));
  },

  _setPicker: function (hex, hsv, rgb, mousePicker, mouseSlide) {
    this.model.set({ hex: hex, r: rgb.r, g: rgb.g, b: rgb.b, a: 100 });

    ColorPicker.positionIndicators( // eslint-disable-line
      this.$('.js-sliderIndicator').get(0),
      this.$('.js-pickerIndicator').get(0),
      mouseSlide, mousePicker
    );
  }
});

