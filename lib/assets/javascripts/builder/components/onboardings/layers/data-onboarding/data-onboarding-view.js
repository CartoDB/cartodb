var _ = require('underscore');
var $ = require('jquery');
var OnboardingView = require('builder/components/onboardings/generic/generic-onboarding-view');
var template = require('./data-onboarding.tpl');

module.exports = OnboardingView.extend({
  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: 4,
      modifier: '--data'
    }));
  },

  _onChangeStep: function () {
    OnboardingView.prototype._onChangeStep.call(this);

    var step = this.model.get('step');

    if (step === 0) {
      this._setMiddlePad('.js-editorPanel');
    } else if (step === 1) {
      this._setMiddlePad('.js-editorPanelHeader', {top: 16, right: 24, left: 24});
    } else if (step === 2) {
      this._setMiddlePad('.js-editorPanelContent', {top: 8, right: 24, left: 24, bottom: -$('.js-optionsBar').outerHeight()});
    } else if (step === 3) {
      this._setMiddlePad('.js-optionsBar', null, {top: -190});
    } else if (step === 4) {
      var featurePosition = this._getFeatureEditionPosition();
      this._setMiddlePad(featurePosition, {top: 8, right: 8, bottom: 8, left: 8}, {top: -270, left: -330});
    }
  },

  _getFeatureEditionPosition: function () {
    var $switch = $('.js-mapTableView').first();
    var $featureEdition = $('.js-newGeometryView').first();
    var leftOffset = Math.min($switch.length > 0 ? $switch.offset().left : Number.MAX_VALUE, $featureEdition.length > 0 ? $featureEdition.offset().left : Number.MAX_VALUE);
    var topOffset = Math.min($switch.length > 0 ? $switch.offset().top : Number.MAX_VALUE, $featureEdition.length > 0 ? $featureEdition.offset().top : Number.MAX_VALUE);
    var rightOffset = Math.max(
      $switch.length > 0 ? $switch.offset().left + $switch.outerWidth() : Number.MIN_VALUE,
      $featureEdition.length > 0 ? $featureEdition.offset().left + $featureEdition.outerWidth() : Number.MIN_VALUE
    );
    var bottomOffset = Math.max(
      $switch.length > 0 ? $switch.offset().top + $switch.outerHeight() : Number.MIN_VALUE,
      $featureEdition.length > 0 ? $featureEdition.offset().top + $featureEdition.outerHeight() : Number.MIN_VALUE
    );

    return {
      left: leftOffset,
      top: topOffset,
      width: rightOffset - leftOffset,
      height: bottomOffset - topOffset
    };
  }
});
