/* Progress quota bar for organization users input */

module.exports = cdb.core.View.extend({

  events: {
    'keyup .js-assignedSize': '_onKeyup'
  },

  initialize: function() {
    this._initBinds();
    this._initViews();
  },

  _initBinds: function() {
    this.model.bind('change:quota_in_bytes', this._onQuotaChange, this);
  },

  _initViews: function() {
    var quotaInMb = Math.floor(this.model.get('quota_in_bytes')/1024/1024).toFixed(0);
    this.$('.js-assignedSize').val(quotaInMb);
  },

  _onQuotaChange: function() {
    this.$('.js-assignedSize').val(Math.floor(this.model.get('quota_in_bytes')/1024/1024).toFixed(0));
  },

  _onKeyup: function() {
    var modifiedQuotaInBytes = Math.floor(this.$('.js-assignedSize').val() * 1048576);
    var assignedPer = (modifiedQuotaInBytes*100) / this.model.organization.get('available_quota_for_user');

    assignedPer > 100 ? this.$('.js-assignedSize').addClass('FormAccount-input--error') : this.$('.js-assignedSize').removeClass('FormAccount-input--error');

    if (assignedPer <= 100) {
      this.model.set('quota_in_bytes', modifiedQuotaInBytes);
    }

  }

})