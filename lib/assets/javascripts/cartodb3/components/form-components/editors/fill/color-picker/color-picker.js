var _ = require('underscore');
var cdb = require('cartodb.js');
require('bootstrap-colorpicker');
var template = require('./template.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    this.model = new cdb.core.Model({
      hex: opts.value,
      opacity: opts.opacity
    });

    this._initBinds();
  },

  render: function () {
    var rgb = this._hexToRGB(this.model.get('hex'));

    var color = _.extend(rgb, {
      hex: this.model.get('hex'),
      opacity: this.model.get('opacity')
    });

    this.$el.append(template(color));

    var rgbaTemplate = _.template('rgba(<%- r %>, <%- g %>, <%- b %>, <%- opacity %>)');

    this.$('.js-colorPicker').colorpicker({
      color: rgbaTemplate(color),
      format: 'rgba',
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
          maxLeft: 206,
          maxTop: 95,
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
      self.model.set({ hex: hex, r: rgb.r, g: rgb.g, b: rgb.b, opacity: rgb.a });
      self.$('.js-color').css('opacity', rgb.a);
    });

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:hex', this._onChangeColor, this);
    this.model.bind('change:r', this._onChangeColor, this);
    this.model.bind('change:g', this._onChangeColor, this);
    this.model.bind('change:b', this._onChangeColor, this);
    this.model.bind('change:opacity', this._onChangeColor, this);
  },

  _hexToRGB: function (hex) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return { r: r, g: g, b: b };
  },

  _onChangeColor: function () {
    this.trigger('change', { opacity: this.model.get('opacity'), hex: this.model.get('hex') }, this);
    this.$('.js-hex').val(this.model.get('hex').substr(1));
    this.$('.js-r').val(this.model.get('r'));
    this.$('.js-g').val(this.model.get('g'));
    this.$('.js-b').val(this.model.get('b'));
    this.$('.js-a').val(this.model.get('opacity'));
  }
});

