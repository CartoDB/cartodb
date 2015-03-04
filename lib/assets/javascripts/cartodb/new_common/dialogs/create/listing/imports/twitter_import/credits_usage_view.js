var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var CreditsInfo = require('./credits_info_view');

/**
 *  Set max use of credits for Twitter
 *
 *  - Slider range = 1000 credits
 *  - Last step should be infinite if user doesn't
 *    have "soft_limit".
 *
 */

module.exports = cdb.core.View.extend({

  _SLIDER_STEP: 1000,
  _DEFAULT_PER_VALUE: 80,

  initialize: function() {
    this.user = this.options.user;
    this.model = new cdb.core.Model();
    this._initBinds();
    this._setModel();
  },

  render: function() {
    this.clearSubViews();
    this.$(".js-slider").slider("destroy");
    this._initViews();
    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onSlideChange');
    this.model.bind('change:value', this._onValueChange, this);
  },

  _setModel: function() {
    var twitterData = this.user.get('twitter');
    var max = twitterData.quota - twitterData.monthly_use;
    var defaultValue = (max * this._DEFAULT_PER_VALUE) / 100;
    var value = max > this._SLIDER_STEP ? defaultValue : max + this._SLIDER_STEP
    
    this.model.set({
      max: (twitterData.hard_limit ? max : max + this._SLIDER_STEP ),
      min: this._SLIDER_STEP,
      step: this._SLIDER_STEP,
      value: value,
      disabled: max > this._SLIDER_STEP ? false : true
    });
  },

  _initViews: function() {
    // Slider
    this.$(".js-slider").slider(
      _.extend({
          range: 'min',
          orientation: "horizontal",
          slide: this._onSlideChange,
          change: this._onSlideChange
        },
        this.model.attributes
      )
    );

    // Info
    var creditsInfo = new CreditsInfo({
      el: this.$('.js-info'),
      user: this.user,
      model: this.model
    });
    creditsInfo.render();
    this.addView(creditsInfo);
  },

  _onSlideChange: function(ev, ui) {
    this.model.set('value', ui.value);
  },

  _onValueChange: function() {
    this.trigger('maxCreditsChange', this.getMaxCredits(), this);
  },

  getMaxCredits: function() {
    var twitterData = this.user.get('twitter');
    var max = twitterData.quota - twitterData.monthly_use;
    var value = this.model.get('value');
    return value > max ? 0 : value
  }

});