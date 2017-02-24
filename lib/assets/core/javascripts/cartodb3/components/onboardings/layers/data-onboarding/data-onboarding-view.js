var _ = require('underscore');
var $ = require('jquery');
var OnboardingView = require('../layer-onboarding-view');
var template = require('./data-onboarding.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'numberOfWidgets',
  'hasTimeSeries',
  'hasAnimatedTimeSeries'
];

module.exports = OnboardingView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: 4,
      modifier: '--data'
    }));

    this._hasSidebarWidgets = (this._hasTimeSeries && this._numberOfWidgets > 1) || (!this._hasTimeSeries && this._numberOfWidgets > 0);
  },

  render: function () {
    this.$el.html(this._template({
      hasSidebarWidgets: this._hasSidebarWidgets,
      hasTimeSeries: this._hasTimeSeries,
      hasAnimatedTimeSeries: this._hasAnimatedTimeSeries
    }));
    this.$el.addClass('LayerOnboarding' + this._modifier);

    return this;
  },

  _onChangeStep: function () {
    OnboardingView.prototype._onChangeStep.call(this);

    var step = this.model.get('step');
    console.log('step: ' + step);

    var vh = $(window).height();

    if (step === 0) {
      this._setMiddlePad('.js-editorPanel', vh, null, { top: 0, middle: 0, bottom: vh});
    } else if (step === 1) {
      this._setMiddlePad('.js-editorPanel', '.js-editorPanelHeader', {top: 16});
    } else if (step === 2) {
      this._setMiddlePad('.js-editorPanel', '.js-editorPanelContent', { top: 8, bottom: -$('.js-optionsBar').outerHeight() });
    } else if (step === 3) {
      this._setMiddlePad('.js-editorPanel', '.js-optionsBar');
    } else if (step === 4) {
      var featurePosition = this._getFeatureEditionPosition();
      this._setMiddlePad('.js-editorPanel', 0, null, { top: featurePosition.top, middle: featurePosition.height, bottom: 100 });
    }
    // } else if (step === 4) {
    //   this._setMiddlePad('.js-editorPanel', 0, null, { top: vh, middle: 0, bottom: 0 });
    // }
  },

  _setMiddlePad: function (width, height, padding, forceSize) {
    var $window = $(window);
    var $top = $('.LayerOnboarding-pads--left .LayerOnboarding-padTop');
    var $middle = $('.LayerOnboarding-pads--left .LayerOnboarding-padMiddle');
    var $bottom = $('.LayerOnboarding-pads--left .LayerOnboarding-padBottom');
    padding = this._buildPadding(padding);

    var vh = $window.height();
    var finalWidth = 0;
    if (_.isFinite(width)) {
      finalWidth = width;
    } else if (_.isString(width)) {
      finalWidth = $(width).outerWidth();
    }

    // Width
    $top.outerWidth(finalWidth);
    $middle.outerWidth(finalWidth);
    $bottom.outerWidth(finalWidth);

    // Height
    var middleOffset = 0;
    var middleHeight = 0;
    if (_.isFinite(height)) {
      middleOffset = height;
    } else if (_.isString(height)) {
      middleOffset = $(height).offset().top;
      middleHeight = $(height).outerHeight();
    }
    var topHeight = middleOffset - padding.top;
    middleHeight += padding.top + padding.bottom;
    var bottomHeight = vh - (topHeight + middleHeight);

    topHeight = forceSize && forceSize.top ? forceSize.top : topHeight;
    middleHeight = forceSize && forceSize.middle ? forceSize.middle : middleHeight;
    bottomHeight = forceSize && forceSize.bottom ? forceSize.bottom : bottomHeight;

    $top.outerHeight(topHeight);
    $middle.outerHeight(middleHeight);
    $bottom.outerHeight(bottomHeight);

    console.log('[ ' + topHeight + ', ' + middleHeight + ', ' + bottomHeight + ' ]');

    this._getFeatureEditionPosition();
  },

  _buildPadding: function (padding) {
    var result = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    if (padding) {
      result.top = this._calculatePadding(padding.top);
      result.right = this._calculatePadding(padding.right);
      result.bottom = this._calculatePadding(padding.bottom);
      result.left = this._calculatePadding(padding.left);
    }

    return result;
  },

  _calculatePadding: function (padding) {
    return (padding && _.isFinite(padding)) ? padding : 0;
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
