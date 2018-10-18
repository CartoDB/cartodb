const $ = require('jquery');
const CoreView = require('backbone/core-view');

/* Progress quota bar for organization users input */

module.exports = CoreView.extend({

  events: {
    'keyup .js-assignedSize': '_onKeyup'
  },

  initialize: function () {
    this._initBinds();
    this._initViews();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:quota_in_bytes', this._onQuotaChange);
  },

  _initViews: function () {
    const quotaInMb = Math.max(Math.floor(this.model.get('quota_in_bytes') / 1024 / 1024).toFixed(0), 1);
    this.$('.js-assignedSize').val(quotaInMb);
  },

  _onQuotaChange: function () {
    this.$('.js-assignedSize').val(Math.max(this.model.assignedQuotaInRoundedMb(), 1));
  },

  _onKeyup: function () {
    const modifiedQuotaInBytes = Math.max(Math.floor(this.$('.js-assignedSize').val() * 1048576), 1048576);
    const assignedPer = (modifiedQuotaInBytes * 100) / this.model.organization.get('available_quota_for_user');
    const errorMessage = '<p class="FormAccount-rowInfoText FormAccount-rowInfoText--error js-userQuotaError">Invalid quota, insert a valid one.</p>';

    if (!isNaN(assignedPer)) {
      this.model.set('quota_in_bytes', modifiedQuotaInBytes);
    }

    if (isNaN(assignedPer) || (this.model.get('quota_in_bytes') > this.model.organization.get('available_quota_for_user')) || (this.model.get('quota_in_bytes') < this.model.get('db_size_in_bytes'))) {
      this.$('.js-assignedSize').addClass('has-error');

      if (this.$('.js-userQuotaError').length === 0) {
        $('.js-userQuotaSliderInput').append(errorMessage);
      }
    } else {
      this.$('.js-assignedSize').removeClass('has-error');
      this.$('.js-userQuotaError').remove();
    }
  }
});
