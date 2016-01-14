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
    var userQuotaPer = (this.model.get('quota_in_bytes') * 100) / this.model.organization.get('available_quota_for_user');
    var usedUserQuota = (this.model.get('db_size_in_bytes') * 100) / this.model.organization.get('available_quota_for_user');
    var userMinQuota = 104857600 / this.model.organization.get('available_quota_for_user');

    // Init slider
    this.$(".js-slider").slider({
      max: 100,
      min: userMinQuota,
      step: 1,
      value: userQuotaPer,
      range: 'min',
      orientation: "horizontal",
      slide: this._onSlideChange.bind(this)
    });

    $(".ui-slider-handle").addClass('js-quotaProgressSlider');
  },

  _onSlideChange: function(ev, ui) {
    var userQuota = Math.max(Math.floor((this.model.organization.get('available_quota_for_user') * ui.value) / 100), 1);
    var usedUserQuota = (this.model.get('db_size_in_bytes') * 100) / this.model.organization.get('available_quota_for_user');
    var assignedPer = (userQuota * 100) / this.model.organization.get('available_quota_for_user');

    if (ui.value >= usedUserQuota) {
      this.$('.ui-slider-range').css('width', assignedPer + '%');
      this.$('.js-quotaProgressSlider').css('left', assignedPer + '%');

      var tooltipLeft = $('.js-quotaProgressSlider').offset().left 
        - ($('.js-orgUserQuotaTooltip').outerWidth() / 2)
        + ($('.js-quotaProgressSlider').outerWidth() / 2);

      $('.js-orgUserQuotaTooltip').css('left', tooltipLeft);

      this.model.set('quota_in_bytes', userQuota);
    } else {
      return false;
    }
  },

  _onQuotaChange: function() {
    var userQuota = this.model.get('quota_in_bytes');
    var usedUserQuota = (this.model.get('db_size_in_bytes') * 100) / this.model.organization.get('available_quota_for_user');
    var assignedPer = Math.min((userQuota * 100) / this.model.organization.get('available_quota_for_user'), 100);

    if (assignedPer >= usedUserQuota) {
      $('.ui-slider-range').css('width', assignedPer + '%');
      $('.js-quotaProgressSlider').css('left', assignedPer + '%');
    }
  },
  
  _showTooltip: function() {
    var viewModel = this.model;

    this.addView(
      new cdb.common.TipsyTooltip({
        el: $('.js-quotaProgressSlider'),
        className: 'js-orgUserQuotaTooltip',
        title: function() {
          var quotaPer = Math.min((viewModel.get('quota_in_bytes') * 100) / viewModel.organization.get('available_quota_for_user'), 100);
          return quotaPer.toFixed(0) + "% of the available org quota";
        }
      })
    );
  }

})