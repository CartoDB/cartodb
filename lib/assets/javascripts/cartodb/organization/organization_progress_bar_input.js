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

    // Private variable to access the model
    model = this.model;

    this._initBinds();
    this._initViews();
  },

  _initBinds: function() {
    model.bind('change:userQuota', this._onQuotaChange, this);
  },

  _initViews: function() {
    var userQuota = model.get('userQuota');

    this.$('.js-assignedSize').val(Utils.readablizeBytes(userQuota).replace(/[.]\d*\s\w*/, ""));
  },

  _onQuotaChange: function() {
    var orgQuota = model.get('orgQuota');
    var modifiedQuotaInBytes = (this.$('.js-assignedSize').val() * 1048576) * 100;
    var assignedPer = modifiedQuotaInBytes / orgQuota;

    // This value avoids slider elements to overstep progress bar max width
    var assignedPerValue = (assignedPer < 100 ? assignedPer : 100);

    this.$('.ui-slider-range').css('width', assignedPerValue + '%');
    $('.js-quotaProgressSlider').css('left', assignedPerValue + '%');

    assignedPerValue == 100 ? this.$('.js-assignedSize').addClass('FormAccount-input--error') : this.$('.js-assignedSize').removeClass('FormAccount-input--error');

    $('#user_quota').val(modifiedQuotaInBytes);
    model.set('userQuota', modifiedQuotaInBytes);
  }

})