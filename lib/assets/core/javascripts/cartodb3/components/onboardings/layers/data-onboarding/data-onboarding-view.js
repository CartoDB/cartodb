var _ = require('underscore');
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
  }
});
