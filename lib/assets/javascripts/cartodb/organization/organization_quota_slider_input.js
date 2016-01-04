var $ = require('jquery');
var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');

/* Progress quota bar for organization users input */

module.exports = cdb.core.View.extend({

  events: {
    'keyup .js-assignedSize': '_onKeyup'
  },

  initialize: function() {
    if (this.options.quota_in_bytes === undefined || this.options.used_quota_in_bytes === undefined || this.options.userQuota === undefined) {
      throw new TypeError('Missing parameters for organization user progress bar');
    }
    this.$input = this.options.input;
    this.model = new cdb.core.Model({
      orgQuota: this.options.quota_in_bytes,
      orgUsedQuota: this.options.used_quota_in_bytes,
      userName: this.options.userName,
      userUsedQuota: this.options.userUsedQuota,
      userQuota: this.options.userQuota
    });

    this._isKeyup = false;

    // Private variable to access the model
    model = this.model;

    model.bind('change:userQuota', this._onQuotaChange, this);
    this.$('.js-assignedSize').val((model.get('userQuota')/1024/1024).toFixed(0));
  },

  _onQuotaChange: function() {

    if (this._isKeyup == false) {

      this._isKeyup = true;

      var orgAvailableQuota = model.get('orgQuota') - model.get('orgUsedQuota');
      var modifiedQuotaInBytes = Math.floor(this.$('.js-assignedSize').val() * 1048576);
      var assignedPer = (modifiedQuotaInBytes*100) / orgAvailableQuota;

      this.$('.js-assignedSize').val(Math.floor(model.get('userQuota')/1024/1024).toFixed(0));

      assignedPer > 100 ? this.$('.js-assignedSize').addClass('FormAccount-input--error') : this.$('.js-assignedSize').removeClass('FormAccount-input--error');

      this._isKeyup = false;

    }

  },

  _onKeyup: function() {
    var orgAvailableQuota = model.get('orgQuota') - model.get('orgUsedQuota');
    var modifiedQuotaInBytes = Math.floor(this.$('.js-assignedSize').val() * 1048576);
    var assignedPer = (modifiedQuotaInBytes*100) / orgAvailableQuota;

    if (assignedPer <= 100) {
      $('#user_quota').val(modifiedQuotaInBytes);
      model.set('userQuota', modifiedQuotaInBytes);
    }

  }

})