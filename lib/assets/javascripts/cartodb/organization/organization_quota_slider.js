var $ = require('jquery');
var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');

/* Progress quota bar for organization users */

module.exports = cdb.core.View.extend({

  events: {
    'hover .js-quotaProgressSlider': '_showTooltip'
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

    // Private variable to access the model
    model = this.model;

    model.bind('change:userQuota', this._onQuotaChange, this);
    this._initViews();


    var userQuota = model.get('userQuota');
    var orgAvailableQuota = model.get('orgQuota') - model.get('orgUsedQuota');

    var userQuotaPer = (model.get('userQuota') * 100) / (model.get('orgQuota') - model.get('orgUsedQuota'));
    var minQuotaPer = Math.max(((model.get('userUsedQuota') || 1) * 100) / orgAvailableQuota, 0);

    // Init slider
    this.$(".js-slider").slider({
      max: 100,
      min: minQuotaPer,
      step: 1,
      value: userQuotaPer,
      range: 'min',
      orientation: "horizontal",
      slide: this._onSlideChange,
      start: this._startSliding,
      stop: this._stopSliding
    });

  },

  _initViews: function() {
    $(".UserQuotaDropdown-slider .ui-slider-handle").addClass('js-quotaProgressSlider');
  },

  _startSliding: function() {

  },

  _stopSliding: function() {

  },

  _onSlideChange: function(ev, ui) {
    var orgAvailableQuota = model.get('orgQuota') - model.get('orgUsedQuota');
    var userQuota = Math.floor((orgAvailableQuota * ui.value) / 100);
    // $('.js-assignedSize').val(Math.floor(userQuota/1024/1024).toFixed(0));

    $('#user_quota').val(userQuota);
    model.set('userQuota', userQuota);
  },

  _onQuotaChange: function() {
    console.log("BIND SLIDER");

    var userQuota = model.get('userQuota');
    var orgAvailableQuota = model.get('orgQuota') - model.get('orgUsedQuota');
    var assignedPer = (userQuota * 100) / orgAvailableQuota;

    this.$('.ui-slider-range').css('width', assignedPer + '%');
    $('.js-quotaProgressSlider').css('left', assignedPer + '%');
  },
  
  _showTooltip: function(ev) {
    this.addView(
      new cdb.common.TipsyTooltip({
        el: $('.js-quotaProgressSlider'),
        title: function() {
          var orgAvailableQuota = model.get('orgQuota') - model.get('orgUsedQuota');
          var quotaPer = (model.get('userQuota') * 100) / orgAvailableQuota;
          return quotaPer.toFixed(0) + "% of the available org quota";
        }
      })
    );
  }

})