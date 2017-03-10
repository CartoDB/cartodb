var cdb = require('cartodb.js-v3');
var UserQuotaSlider = require('./organization_user_quota_slider');
var UserQuotaSliderInput = require('./organization_user_quota_slider_input');

/* Progress quota bar for organization users */

module.exports = cdb.core.View.extend({

  initialize: function () {
    // Quota slider
    this.userQuotaSlider = new UserQuotaSlider({
      el: this.$('.js-userQuotaSlider'),
      model: this.model
    });

    this.addView(this.userQuotaSlider);

    // Quota slider input
    this.userQuotaSliderInput = new UserQuotaSliderInput({
      el: this.$('.js-userQuotaSliderInput'),
      model: this.model
    });

    this.addView(this.userQuotaSliderInput);

    this._initBinds();
  },

  _initBinds: function () {
    this.model.bind('change:quota_in_bytes', this._onQuotaChange, this);
  },

  _onQuotaChange: function (model, quota) {
    this.$('#user_quota').val(quota);
  }
});
