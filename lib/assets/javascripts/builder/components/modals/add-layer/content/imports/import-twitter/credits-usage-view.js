var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
require('jquery-ui');
var CreditsInfoView = require('./credits-info-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'userModel'
];

var DEFAULT_PER_VALUE = 80;
var MIN_PER_VALUE = 1;

/**
 *  Set max use of credits for Twitter
 *
 *  - Slider range = 1000 credits
 *  - Last step should be infinite if user doesn't
 *    have "soft_limit".
 *
 */

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._disabled = (opts && opts.disabled) ? opts.disabled : false;

    this.model = new Backbone.Model();
    this._initBinds();
    this._setModel();
  },

  render: function () {
    this.clearSubViews();
    this._destroySlider();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:value', this._onValueChange, this);
  },

  _setModel: function () {
    var twitterData = this._userModel.get('twitter');
    var max = twitterData.quota - twitterData.monthly_use;
    var min = (MIN_PER_VALUE * max) / 100; // Just 1% of the quota
    var defaultValue = (max * DEFAULT_PER_VALUE) / 100;
    var value = max > 0 ? defaultValue : (max + 1);

    var self = this;
    this.model.set({
      max: (twitterData.hard_limit ? max : max + 1),
      min: min,
      step: min,
      value: max > 0 ? value : twitterData.quota,
      disabled: self._disabled || max <= 0
    });
  },

  _initViews: function () {
    this._setModel();
    this.$('.js-slider').slider(
      _.extend({
        range: 'min',
        orientation: 'horizontal',
        slide: this._onSlideChange.bind(this),
        change: this._onSlideChange.bind(this)
      },
      this.model.attributes
      )
    );

    var creditsInfo = new CreditsInfoView({
      el: this.$('.js-info'),
      userModel: this._userModel,
      model: this.model
    });
    creditsInfo.render();
    this.addView(creditsInfo);
  },

  _onSlideChange: function (ev, ui) {
    this.model.set('value', ui.value);
  },

  _onValueChange: function () {
    this.trigger('maxCreditsChange', this.getMaxCredits(), this);
  },

  getMaxCredits: function () {
    var twitterData = this._userModel.get('twitter');
    var max = twitterData.quota - twitterData.monthly_use;
    var value = this.model.get('value');
    return value > max ? 0 : value;
  },

  _destroySlider: function () {
    if (this.$('.js-slider').data('ui-slider')) {
      this.$('.js-slider').slider('destroy');
    }
  },

  clean: function () {
    this._destroySlider();
    CoreView.prototype.clean.call(this);
  }

});
