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

    var from = this.model.previous('step');
    var step = this.model.get('step');

    var vh = $(window).height();
    //$('.LayerOnboarding-body.is-step' + from).css('opacity', 0);

    if (step === 0) {
      this._setMiddlePad('.js-editorPanel');
    } else if (step === 1) {
      this._setMiddlePad('.js-editorPanelHeader', {top: 16, right: 24, left: 24});
    } else if (step === 2) {
      this._setMiddlePad('.js-editorPanelContent', {top: 8, right: 24, left: 24, bottom: -$('.js-optionsBar').outerHeight()});
    } else if (step === 3) {
      this._setMiddlePad('.js-optionsBar');
    } else if (step === 4) {
      var featurePosition = this._getFeatureEditionPosition();
      this._setMiddlePad(featurePosition, {top: 8, right: 8, bottom: 8, left: 8});
    }

    //$('.LayerOnboarding-body.is-step' + step).css('opacity', 1);
  },

  _setMiddlePad: function (position, padding) {
    var $window = $(window);
    var $top = $('.LayerOnboarding-pads--left .LayerOnboarding-padTop');
    var $middle = $('.LayerOnboarding-pads--left .LayerOnboarding-padMiddle');
    var $bottom = $('.LayerOnboarding-pads--left .LayerOnboarding-padBottom');
    var vh = $window.height();
    var vw = $window.width();
    var isSelector = _.isString(position);
    var $el; 
    var width = 0;
    var height = 0;
    var left = 0;
    var top = 0;
    if (isSelector) {
      $el = $(position);
      width = $el.outerWidth();
      height = $el.outerHeight();
      left = $el.offset().left;
      top = $el.offset().top;
    } else {
      width = position.width;
      height = position.height;
      left = position.left;
      top = position.top;
    }

    // Apply padding
    var appliedPadding = this._buildPadding(padding);
    top -= appliedPadding.top;
    left -= appliedPadding.left;
    width += appliedPadding.left + appliedPadding.right;
    height += appliedPadding.top + appliedPadding.bottom;

    // Is it place outside the viewport?
    if (vw - left > 0 && vw - left < width) {
      width = vw - left;
    } else if (vw -left <= 0) {
      width = 0;
    }

    // Left offset
    $('.LayerOnboarding-toolbarOverlay').outerWidth(left);

    // Right panel
    $('.LayerOnboarding-contentWrapper').outerWidth(vw - (left + width));

    // Width
    $('.LayerOnboarding-pads--left').outerWidth(width);
    $top.outerWidth(width);
    $middle.outerWidth(width);
    $bottom.outerWidth(width);

    // Height
    var topHeight = top;
    var middleHeight = height;
    var bottomHeight = vh - (topHeight + middleHeight);

    $top.outerHeight(topHeight);
    $middle.outerHeight(middleHeight);
    $bottom.outerHeight(bottomHeight);
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
