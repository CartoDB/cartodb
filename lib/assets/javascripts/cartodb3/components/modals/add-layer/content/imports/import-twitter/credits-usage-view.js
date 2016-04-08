var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
require('jquery-ui/slider');
var CreditsInfoView = require('./credits-info-view');
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

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    this._userModel = opts.userModel;
    this.model = new cdb.core.Model();
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

    this.model.set({
      max: (twitterData.hard_limit ? max : max + 1),
      min: min,
      step: min,
      value: max > 0 ? value : twitterData.quota,
      disabled: max > 0
    });
  },

  _initViews: function () {
    // Slider
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

    // Info
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
    // if (this.$('.js-slider').slider('instance')) {
    //   this.$('.js-slider').slider('destroy');
    // }
  },

  clean: function () {
    this._destroySlider();
    cdb.core.View.prototype.clean.call(this);
  }

});
