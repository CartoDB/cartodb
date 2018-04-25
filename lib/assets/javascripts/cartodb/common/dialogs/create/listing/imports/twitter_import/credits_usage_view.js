var cdb = require('cartodb.js-v3');
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

  _DEFAULT_PER_VALUE: 80, // Default percentage value for slider
  _MIN_PER_VALUE: 1,      // Default min percentage value for slider

  initialize: function() {
    this._disabled = (this.options && this.options.disabled) ? this.options.disabled : false;    
    
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
    var min =  (this._MIN_PER_VALUE * max) / 100; // Just 1% of the quota
    var defaultValue = (max * this._DEFAULT_PER_VALUE) / 100;
    var value = max > 0 ? defaultValue : (max + 1);
    
    var self = this;    
    this.model.set({
      max: (twitterData.hard_limit ? max : max + 1 ),
      min: min,
      step: min,
      value: max > 0 ? value : twitterData.quota,
      disabled: self._disabled || max <= 0
    });
  },

  _initViews: function() {
    this._setModel();
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