var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ColorPicker = require('../../color-picker/color-picker');
var template = require('./input-color-picker-view.tpl');
var InputColorPickerHeader = require('./input-color-picker-header');

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts || !opts.ramp) throw new Error('ramp param is required');
    if (!opts.opacity) throw new Error('opacity is required');

    this.model = new Backbone.Model({
      index: this.options.index,
      ramp: opts.ramp,
      opacity: opts.opacity
    });

    this.model.bind('change:index', this._onChangeIndex, this);
    this.model.bind('change:opacity', this._onOpacityChanged, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._headerView = new InputColorPickerHeader({
      model: this.model,
      iconStylingEnabled: this.options.iconStylingEnabled
    });
    this._headerView.bind('goToAssetPicker', this._onGoToAssetPicker, this);

    this.addView(this._headerView);

    this._colorPicker = new ColorPicker({
      value: this._getColor(),
      opacity: 1,
      disableOpacity: true
    });

    this.addView(this._colorPicker);

    this._colorPicker.bind('change', this._onChangeValue, this);

    this.$el.append(template());

    this.$('.js-header').append(this._headerView.render().$el);
    this.$('.js-content').append(this._colorPicker.render().$el);

    return this;
  },

  _setColor: function (color) {
    var ramp = _.clone(this.model.get('ramp'));
    ramp[this.model.get('index')].color = color;
    this.model.set('ramp', ramp);
    this.model.trigger('change', ramp);
    this.trigger('change', ramp);
  },

  _getColor: function () {
    var ramp = this.model.get('ramp');
    return ramp[this.model.get('index') || 0].color;
  },

  _onChangeIndex: function () {
    this._colorPicker.setColor(this._getColor());
    this.trigger('changeIndex', this.model.get('index'), this);
  },

  _onChangeValue: function (color) {
    this._setColor(color.hex);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.trigger('back', this);
  },

  _onOpacityChanged: function () {
    var opacity = this.model.get('opacity');
    this.trigger('change:opacity', opacity);
  },

  _onGoToAssetPicker: function () {
    this.trigger('goToAssetPicker');
  }
});
