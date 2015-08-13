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

  className: 'CreditsUsage',

  _DEFAULT_PER_VALUE: 80, // Default percentage value for slider
  _MIN_PER_VALUE: 1,      // Default min percentage value for slider

  options: {
    property: 'value' // Model attribute name
  },

  initialize: function() {
    this.user = this.options.user;
    
    if (!this.model) {
      this.model = new cdb.core.Model();
    }

    // Setting property in case it doesn't exist
    var attrs = {};
    attrs[this.options.property] = '';
    this.model.set(attrs);
    
    this.template = cdb.templates.getTemplate('common/dialogs/create/listing/imports/twitter_import/credits_usage');
    this._initBinds();
    this._setModel();
  },

  render: function() {
    this.clearSubViews();
    this.$(".js-slider").slider("destroy");
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onSlideChange');
  },

  _setModel: function() {
    var twitterData = this.user.get('twitter');
    var max = twitterData.quota - twitterData.monthly_use;
    var min =  (this._MIN_PER_VALUE * max) / 100; // Just 1% of the quota
    var defaultValue = (max * this._DEFAULT_PER_VALUE) / 100;
    var value = max > 0 ? defaultValue : (max + 1);

    var d = {
      max: (twitterData.hard_limit ? max : max + 1 ),
      min: min,
      step: min,
      disabled: max > 0 ? false : true
    };
    d[this.options.property] = value;
    
    this.model.set(d);
  },

  _initViews: function() {
    // Slider
    this.$(".js-slider").slider({
      range: 'min',
      orientation: "horizontal",
      slide: this._onSlideChange,
      change: this._onSlideChange,
      max: this.model.get('max'),
      min: this.model.get('min'),
      step: this.model.get('step'),
      disabled: this.model.get('disabled'),
      value: this.model.get(this.options.property)
    });

    // Info
    var creditsInfo = new CreditsInfo({
      el: this.$('.js-info'),
      property: this.options.property,
      user: this.user,
      model: this.model
    });
    creditsInfo.render();
    this.addView(creditsInfo);
  },

  _onSlideChange: function(ev, ui) {
    var twitterData = this.user.get('twitter');
    var max = twitterData.quota - twitterData.monthly_use;
    var hardLimit = twitterData.hard_limit;
    var value =  ui.value > max && !hardLimit ? 0 : Math.min(ui.value, max);
    this.model.set(this.options.property, value);
  }

});