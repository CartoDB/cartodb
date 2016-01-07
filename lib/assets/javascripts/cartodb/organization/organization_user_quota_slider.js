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
    this.model.bind('change:quota_in_bytes', this._onQuotaChange, this);
  },

  _initViews: function() {
    var orgAvailableQuota = this.model.organization.get('unassigned_quota');
    var userQuotaPer = (this.model.get('quota_in_bytes') * 100) / orgAvailableQuota;
    var minQuotaPer = Math.max(((this.model.get('db_size_in_bytes') || 1) * 100) / orgAvailableQuota, 0);

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
    var userQuota = Math.floor((this.model.organization.get('unassigned_quota') * ui.value) / 100);
    this.model.set('quota_in_bytes', userQuota);
  },

  _onQuotaChange: function() {
    var userQuota = this.model.get('quota_in_bytes');
    var assignedPer = (userQuota * 100) / this.model.organization.get('unassigned_quota');

    $('.ui-slider-range').css('width', assignedPer + '%');
    $('.js-quotaProgressSlider').css('left', assignedPer + '%');
  },
  
  _showTooltip: function() {
    var viewModel = this.model;

    this.addView(
      new cdb.common.TipsyTooltip({
        el: $('.js-quotaProgressSlider'),
        title: function() {
          var quotaPer = (viewModel.get('quota_in_bytes') * 100) / viewModel.organization.get('unassigned_quota');
          return quotaPer.toFixed(0) + "% of the available org quota";
        }
      })
    );
  }

})