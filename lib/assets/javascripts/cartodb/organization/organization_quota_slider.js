/* Progress quota bar for organization users */

module.exports = cdb.core.View.extend({

  events: {
    'hover .js-quotaProgressSlider': '_showTooltip'
  },

  initialize: function() {
    this._initBinds();
    this._initViews();
  },

  _initBinds: function() {
    this.model.bind('change:userQuota', this._onQuotaChange, this);
  },

  _initViews: function() {
    var orgAvailableQuota = this.model.get('orgQuota') - this.model.get('orgUsedQuota');
    var userQuotaPer = (this.model.get('userQuota') * 100) / (this.model.get('orgQuota') - this.model.get('orgUsedQuota'));
    var minQuotaPer = Math.max(((this.model.get('userUsedQuota') || 1) * 100) / orgAvailableQuota, 0);

    // Init slider
    this.$(".js-slider").slider({
      max: 100,
      min: minQuotaPer,
      step: 1,
      value: userQuotaPer,
      range: 'min',
      orientation: "horizontal",
      slide: this._onSlideChange.bind(this)
    });

    $(".ui-slider-handle").addClass('js-quotaProgressSlider');
  },

  _onSlideChange: function(ev, ui) {
    var orgAvailableQuota = this.model.get('orgQuota') - this.model.get('orgUsedQuota');
    var userQuota = Math.floor((orgAvailableQuota * ui.value) / 100);

    this.model.set('userQuota', userQuota);
  },

  _onQuotaChange: function() {
    var userQuota = this.model.get('userQuota');
    var orgAvailableQuota = this.model.get('orgQuota') - this.model.get('orgUsedQuota');
    var assignedPer = (userQuota * 100) / orgAvailableQuota;

    $('.ui-slider-range').css('width', assignedPer + '%');
    $('.js-quotaProgressSlider').css('left', assignedPer + '%');
  },
  
  _showTooltip: function() {
    var view_model = this.model;

    this.addView(
      new cdb.common.TipsyTooltip({
        el: $('.js-quotaProgressSlider'),
        title: function() {
          var orgAvailableQuota = view_model.get('orgQuota') - view_model.get('orgUsedQuota');
          var quotaPer = (view_model.get('userQuota') * 100) / orgAvailableQuota;
          return quotaPer.toFixed(0) + "% of the available org quota";
        }
      })
    );
  }

})