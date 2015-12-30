var $ = require('jquery');
var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');

/**
 *  Progress quota bar for organization users input
 */

module.exports = cdb.core.View.extend({

  events: {
    'keyup .js-assignedSize': '_onQuotaChange'
  },

  initialize: function() {
    // values?
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

    this._initBinds();
    this._initViews();
  },

  _initBinds: function() {
    this.model.bind('change:userQuota', this._onQuotaChange, this);
  },

  _initViews: function() {
    var userQuota = this.model.get('userQuota');

    this.$('.js-assignedSize').val(Utils.readablizeBytes(userQuota).replace(/[.]\d*\s\w*/, ""));
  },

  _onQuotaChange: function() {
    var orgQuota = this.model.get('orgQuota');
    var modifiedQuotaInBytes = (this.$('.js-assignedSize').val() * 1048576) * 100;
    var assignedPer = modifiedQuotaInBytes / orgQuota;

    if (assignedPer < 100) {
      this.$('.ui-slider-range').css('width', assignedPer + '%');
      $('.js-quotaProgressSlider').css('left', assignedPer + '%');
    }
    else {
      this.$('.ui-slider-range').css('width', '100%');
      $('.js-quotaProgressSlider').css('left', '100%');
    }

    $('#user_quota').val(modifiedQuotaInBytes);
  }

})