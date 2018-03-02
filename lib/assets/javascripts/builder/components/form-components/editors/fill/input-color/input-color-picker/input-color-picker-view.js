var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ColorPicker = require('builder/components/form-components/editors/fill/color-picker/color-picker');
var template = require('./input-color-picker-view.tpl');
var InputColorPickerHeader = require('./input-color-picker-header');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'ramp',
  'opacity'
];

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.model = new Backbone.Model({
      index: this.options.index,
      ramp: opts.ramp,
      opacity: opts.opacity
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:index', this._onChangeIndex);
    this.listenTo(this.model, 'change:opacity', this._onOpacityChanged);
  },

  _initViews: function () {
    this._headerView = new InputColorPickerHeader({
      model: this.model,
      imageEnabled: this.options.imageEnabled
    });

    this.addView(this._headerView);
    this._headerView.bind('goToAssetPicker', this._onGoToAssetPicker, this);
    this.$('.js-header').append(this._headerView.render().$el);

    this._colorPicker = new ColorPicker({
      value: this._getColor(),
      opacity: 1,
      disableOpacity: true
    });

    this.addView(this._colorPicker);
    this._colorPicker.bind('change', this._onChangeValue, this);
    this.$('.js-content').append(this._colorPicker.render().$el);
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
