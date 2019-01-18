var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');

/* Progress quota bar for organization users input */

module.exports = cdb.core.View.extend({

  events: {
    'keyup .js-assignedSize': '_onKeyup'
  },

  initialize: function () {
    this._initBinds();
    this._initViews();
  },

  _initBinds: function () {
    this.model.bind('change:quota_in_bytes', this._onQuotaChange, this);
  },

  _initViews: function () {
    var quotaInMb = Math.max(Math.floor(this.model.get('quota_in_bytes') / 1024 / 1024).toFixed(0), 1);
    this.$('.js-assignedSize').val(quotaInMb);
  },

  _onQuotaChange: function () {
    this.$('.js-assignedSize').val(Math.max(this.model.assignedQuotaInRoundedMb(), 1));
  },

  _onKeyup: function () {
    var modifiedQuotaInBytes = Math.max(Math.floor(this.$('.js-assignedSize').val() * 1048576), 1048576);
    var assignedPer = (modifiedQuotaInBytes * 100) / this.model.organization.get('available_quota_for_user');
    var errorMessage = '<p class="FormAccount-rowInfoText FormAccount-rowInfoText--error js-userQuotaError">Invalid quota, insert a valid one.</p>';

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
