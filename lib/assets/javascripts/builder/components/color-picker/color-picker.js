var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./template.tpl');
var colorPickerTemplate = require('./color-picker-template.tpl');
var Utils = require('builder/helpers/utils');

require('bootstrap-colorpicker');

var ESCAPE_KEY_CODE = 27;

module.exports = CoreView.extend({
  events: {
    'blur .js-hex': '_onChangeHex',
    'blur .js-inputColor': '_onChangeColorValue',
    'blur .js-a': '_onChangeOpacity'
  },

  initialize: function (opts) {
    var opacity = opts.opacity != null ? opts.opacity : 1;

    this.model = new Backbone.Model({
      hex: opts.value,
      opacity: opacity
    });

    this._onEscape = this._onEscapePressed.bind(this);
    this._initBinds();
  },

  render: function () {
    var hex = this.model.get('hex');
    var rgb = Utils.hexToRGB(this._sanitizeHex());
    var color = _.extend(rgb, {
      hex,
      opacity: this.model.get('opacity'),
      opacityDisabled: this.options.disableOpacity
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
      template: colorPickerTemplate(),
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

    if (this.options.disableOpacity) {
      this.$('.js-colorPicker .js-alpha').addClass('is-hidden');
    }

    var setNewColor = function (e) {
      var rgb = e.color.toRGB();
      var hex = e.color.toHex();
      this.model.set({ hex: hex, r: rgb.r, g: rgb.g, b: rgb.b, opacity: rgb.a });
      this.$('.js-color').css('opacity', rgb.a);
    }.bind(this);

    this.$('.js-colorPicker').colorpicker().on('changeColor', setNewColor);

    this._initDocumentBinds();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:hex', this._onChangeColor, this);
    this.model.bind('change:r', this._onChangeColor, this);
    this.model.bind('change:g', this._onChangeColor, this);
    this.model.bind('change:b', this._onChangeColor, this);
    this.model.bind('change:opacity', this._onChangeColor, this);
  },

  _onEscapePressed: function (ev) {
    if (ev.which === ESCAPE_KEY_CODE) {
      this.remove();
    }
  },

  _initDocumentBinds: function () {
    $(document).on('keydown', this._onEscape);
  },

  _destroyDocumentBinds: function () {
    $(document).off('keydown', this._onEscape);
  },

  _sanitizeHex: function () {
    return Utils.sanitizeHex(this.model.get('hex'));
  },

  _onChangeColor: function () {
    this.trigger('change', {
      opacity: this.model.get('opacity'),
      hex: this.model.get('hex')
    }, this);

    this.$('.js-hex').val(this.model.get('hex'));
    this.$('.js-r').val(this.model.get('r'));
    this.$('.js-g').val(this.model.get('g'));
    this.$('.js-b').val(this.model.get('b'));
    this.$('.js-a').val(this.model.get('opacity'));
  },

  _onChangeOpacity: function () {
    var opacity = +this.$('.js-a').val();
    if (_.isNumber(opacity) && opacity >= 0 && opacity <= 1) {
      this.setColor(this.model.get('hex'), opacity);
    }
  },

  _onChangeColorValue: function (e) {
    this.$(e.target).removeClass('has-error');

    var r = +this.$('.js-r').val();
    var g = +this.$('.js-g').val();
    var b = +this.$('.js-b').val();

    var hex = Utils.rgbToHex(r, g, b);

    if (Utils.isValidHex(hex)) {
      this.setColor(hex);
    } else {
      this.$(e.target).addClass('has-error');
    }
  },

  _onChangeHex: function (e) {
    this.$(e.target).removeClass('has-error');

    var hex = this.$('.js-hex').val();

    if (Utils.isValidHex(hex)) {
      this.setColor(hex);
    } else {
      this.$(e.target).addClass('has-error');
    }
  },

  setColor: function (hex, opacity) {
    if (_.isUndefined(opacity)) {
      opacity = this.model.get('opacity') || 1;
    }

    this.$('.js-colorPicker').colorpicker('setValue', Utils.hexToRGBA(hex, opacity));
  },

  clean: function () {
    this._destroyDocumentBinds();
    this.trigger('onClean', this);
    CoreView.prototype.clean.apply(this);
  }
});
