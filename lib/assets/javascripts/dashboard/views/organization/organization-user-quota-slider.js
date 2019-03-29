const $ = require('jquery');
const CoreView = require('backbone/core-view');
const TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

const MAX_QUOTA_BITS = 104857600; // 100Mb

/* Progress quota bar for organization users */

module.exports = CoreView.extend({

  events: {
    'hover .js-quotaProgressSlider': '_showTooltip'
  },

  initialize: function () {
    this._initBinds();
    this._initViews();
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:quota_in_bytes', this._onQuotaChange);
  },

  _initViews: function () {
    const userMinQuota = MAX_QUOTA_BITS / this.model.organization.get('available_quota_for_user');

    // Init slider
    this.$('.js-slider').slider({
      max: 100,
      min: userMinQuota,
      step: 1,
      value: this.model.assignedQuotaPercentage(),
      range: 'min',
      orientation: 'horizontal',
      slide: this._onSlideChange.bind(this)
    });

    $('.ui-slider-handle').addClass('js-quotaProgressSlider');
  },

  _onSlideChange: function (ev, ui) {
    const userQuota = Math.max(Math.floor((this.model.organization.get('available_quota_for_user') * ui.value) / 100), 1);
    const assignedPer = (userQuota * 100) / this.model.organization.get('available_quota_for_user');

    if (ui.value >= this.model.usedQuotaPercentage()) {
      this.$('.ui-slider-range').css('width', `${assignedPer}%`);
      this.$('.js-quotaProgressSlider').css('left', `${assignedPer}%`);

      const tooltipLeft = $('.js-quotaProgressSlider').offset().left -
        ($('.js-orgUserQuotaTooltip').outerWidth() / 2) +
        ($('.js-quotaProgressSlider').outerWidth() / 2);

      $('.js-orgUserQuotaTooltip').css('left', tooltipLeft);

      this.model.set('quota_in_bytes', userQuota);
    } else {
      return false;
    }
  },

  _onQuotaChange: function () {
    if (this.model.assignedQuotaPercentage() >= this.model.usedQuotaPercentage()) {
      const assignedQuotaPercentage = Math.min(this.model.assignedQuotaPercentage(), 100);

      $('.ui-slider-range').css('width', `${assignedQuotaPercentage}%`);
      $('.js-quotaProgressSlider').css('left', `${assignedQuotaPercentage}%`);
    }
  },

  _showTooltip: function () {
    const viewModel = this.model;

    this.addView(
      new TipsyTooltipView({
        el: $('.js-quotaProgressSlider'),
        className: 'js-orgUserQuotaTooltip',
        title: function () {
          const quotaPercentage = viewModel.assignedQuotaPercentage().toFixed(0);

          return `${quotaPercentage}% of the available org quota`;
        }
      })
    );
  }
});
