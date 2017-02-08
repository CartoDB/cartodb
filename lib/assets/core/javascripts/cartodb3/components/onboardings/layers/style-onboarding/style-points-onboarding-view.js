var _ = require('underscore');
var OnboardingView = require('../layer-onboarding-view');
var template = require('./style-points-onboarding.tpl');

module.exports = OnboardingView.extend({
  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: 3,
      modifier: '--stylePoints'
    }));
  }
});
