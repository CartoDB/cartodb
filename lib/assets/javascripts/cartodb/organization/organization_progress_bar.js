var $ = require('jquery');
var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');

/**
 *  Progress quota bar for organization users
 *
 */

module.exports = cdb.core.View.extend({

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
    var orgQuota = this.model.get('orgQuota');
    var assignedPer = (userQuota * 100) / orgQuota;

    var userQuotaPer = (this.model.get('userQuota') * 100) / (this.model.get('orgQuota') - this.model.get('orgUsedQuota'));
    var minQuotaPer = Math.max( ((this.model.get('userUsedQuota') || 1) * 100) / (this.model.get('orgQuota') - this.model.get('orgUsedQuota')), 1);

    // Init slider
    this.$(".js-slider").slider({
      max: 100,
      min: minQuotaPer,
      step: 1,
      value: userQuotaPer,
      range: 'min',
      orientation: "horizontal",
      slide: this._onSlideChange,
      change: this._onSlideChange
    });

    this.$('.js-assignedSize').val(Utils.readablizeBytes(userQuota).replace(/[.]\d*\s\w*/, ""));
    this.$('.js-assignedBar').css('width', assignedPer + '%' );
    $(".UserQuotaDropdown-slider .ui-slider-handle").addClass('js-quotaProgressSlider');
  },

  _onQuotaChange: function() {
    var userQuotaPer = (this.model.get('userQuota') * 100) / (this.model.get('orgQuota') - this.model.get('orgUsedQuota'));
    // this.model.set('userQuota', userQuota);
  },

  _onSlideChange: function(ev, ui) {
    var userQuota = organization_data['quota_in_bytes'] * ( ui.value / 100 );
    $('.js-assignedSize').val(Utils.readablizeBytes(userQuota).replace(/[.]\d*\s\w*/, ""));

    console.log(organization_data['quota_in_bytes']);
    $('#user_quota').val(userQuota);
  }

})