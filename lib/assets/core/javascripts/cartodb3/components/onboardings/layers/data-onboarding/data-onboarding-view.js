var _ = require('underscore');
var OnboardingView = require('../layer-onboarding-view');
var template = require('./data-onboarding.tpl');

module.exports = OnboardingView.extend({

  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: 4,
      modifier: '--data'
    }));
    if (opts.numberOfWidgets === void 0) {
      throw new Error('numberOfWidgets is required');
    }
    if (opts.hasTimeSeries === void 0) {
      throw new Error('hasTimeSeries is required');
    }
    if (opts.hasAnimatedTimeSeries === void 0) {
      throw new Error('hasAnimatedTimeSeries is required');
    }
    this._hasTimeSeries = opts.hasTimeSeries;
    this._hasAnimatedTimeSeries = opts.hasAnimatedTimeSeries;
    this._hasSidebarWidgets = (opts.hasTimeSeries && opts.numberOfWidgets > 1) || (!opts.hasTimeSeries && opts.numberOfWidgets > 0);
  },

  render: function () {
    this.$el.html(this._template({
      hasSidebarWidgets: this._hasSidebarWidgets,
      hasTimeSeries: this._hasTimeSeries,
      hasAnimatedTimeSeries: this._hasAnimatedTimeSeries
    }));

    return this;
  }
});
