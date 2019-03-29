var _ = require('underscore');
var $ = require('jquery');
var OnboardingView = require('builder/components/onboardings/generic/generic-onboarding-view');
var defaultTemplate = require('./style-onboarding.tpl');
var pointsTemplate = require('./style-points-onboarding.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'geom'
];

module.exports = OnboardingView.extend({
  module: 'components/onboardings/layers/style-onboarding/style-onboarding-view',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    var template = defaultTemplate;
    var modifier = '--style';
    var steps = 2;

    if (this._geom === 'point') {
      template = pointsTemplate;
      steps = 3;
    }

    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: steps,
      modifier: modifier
    }));
  },

  _onChangeStep: function () {
    OnboardingView.prototype._onChangeStep.call(this);

    var step = this.model.get('step');

    switch (step) {
      case 0:
        this._setMiddlePad('.js-editorPanel');
        break;
      case 1:
        this._setStepOne();
        break;
      case 2:
        this._setStepTwo();
        break;
      case 3:
        this._highlightOptionsBar();
        break;
    }
  },

  _setStepOne: function () {
    var $noGeom = $('.js-styleNoGeom');

    if ($noGeom.length > 0) {
      this._setMiddlePad('.js-styleNoGeom', {top: 8, right: 24, left: 24, bottom: 8});
    } else if (this._numberOfSteps === 3) {
      var aggregationInfo = this._getAggregationPositionAndPadding();
      this._setMiddlePad(aggregationInfo.position, aggregationInfo.padding);
    } else {
      this._highlightStyleProperties();
    }
  },

  _setStepTwo: function () {
    if (this._numberOfSteps === 2) {
      this._highlightOptionsBar();
    } else {
      this._highlightStyleProperties();
    }
  },

  _highlightStyleProperties: function () {
    this._setMiddlePad('.js-styleProperties', {top: 8, right: 24, left: 24, bottom: 8});
  },

  _highlightOptionsBar: function () {
    this._setMiddlePad('.js-optionsBar', null, {top: -190});
  },

  _getAggregationPositionAndPadding: function () {
    var $aggregationTypes = $('.js-aggregationTypes');
    var $aggregationOptions = $('.js-aggregationOptions');
    var left = $aggregationTypes.offset().left;
    var top = $aggregationTypes.offset().top;
    var width = $aggregationTypes.outerWidth();
    var height = $aggregationTypes.outerHeight();
    var bottomPadding = 0;

    if ($aggregationOptions.length > 0) {
      height += $aggregationOptions.outerHeight();
      bottomPadding = 8;
    }

    return {
      position: {
        top: top,
        left: left,
        width: width,
        height: height
      },
      padding: {
        top: 8,
        right: 24,
        left: 24,
        bottom: bottomPadding
      }
    };
  }
});
