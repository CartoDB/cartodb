var $ = require('jquery');
var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');

/**
 *  Progress quota bar for organization users
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'hover .js-quotaProgressSlider': '_showTooltip'
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
    var orgQuota = model.get('orgQuota');
    var assignedPer = (userQuota * 100) / orgQuota;

    var userQuotaPer = (model.get('userQuota') * 100) / (model.get('orgQuota') - model.get('orgUsedQuota'));
    var minQuotaPer = Math.max( ((model.get('userUsedQuota') || 1) * 100) / (model.get('orgQuota') - model.get('orgUsedQuota')), 1);

    // Init slider
    this.$(".js-slider").slider({
      max: 100,
      min: minQuotaPer,
      step: 1,
      value: userQuotaPer,
      range: 'min',
      orientation: "horizontal",
      slide: this._onSlideChange,
      // change: this._onSlideChange
    });

    this.$('.js-assignedSize').val(Utils.readablizeBytes(userQuota).replace(/[.]\d*\s\w*/, ""));
    this.$('.js-assignedBar').css('width', assignedPer + '%' );
    $(".UserQuotaDropdown-slider .ui-slider-handle").addClass('js-quotaProgressSlider');
  },

  _onQuotaChange: function() {
    var userQuotaPer = (model.get('userQuota') * 100) / (model.get('orgQuota') - model.get('orgUsedQuota'));
  },

  _onSlideChange: function(ev, ui) {
    var userQuota = model.get('orgQuota') * ( ui.value / 100 );
    $('.js-assignedSize').val(Utils.readablizeBytes(userQuota).replace(/[.]\d*\s\w*/, ""));

    $('#user_quota').val(userQuota);
    model.set('userQuota', userQuota);
  },

  _showTooltip: function(ev) {
    var orgQuota = model.get('orgQuota');
    var userQuota = model.get('userQuota');
    var modifiedQuotaInBytes = (this.$('.js-assignedSize').val() * 1048576) * 100;
    var quotaPer = userQuota / orgQuota;

    // Tooltip
    this.addView(
      new cdb.common.TipsyTooltip({
        el: $('.js-quotaProgressSlider'),
        title: function() {
          return quotaPer + "% of the available org quota";
        }
      })
    );
  }

})