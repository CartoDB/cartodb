const CoreView = require('backbone/core-view');
const UserQuotaSlider = require('./organization-user-quota-slider');
const UserQuotaSliderInput = require('./organization-user-quota-slider-input');

/* Progress quota bar for organization users */

module.exports = CoreView.extend({

  initialize: function () {
    this._initBinds();
    this._initViews();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:quota_in_bytes', this._onQuotaChange);
  },

  _initViews: function () {
    // Quota slider
    const userQuotaSlider = new UserQuotaSlider({
      el: this.$('.js-userQuotaSlider'),
      model: this.model
    });

    this.addView(userQuotaSlider);

    // Quota slider input
    const userQuotaSliderInput = new UserQuotaSliderInput({
      el: this.$('.js-userQuotaSliderInput'),
      model: this.model
    });

    this.addView(userQuotaSliderInput);
  },

  _onQuotaChange: function (model, quota) {
    this.$('#user_quota').val(quota);
  }
});
