var _ = require('underscore');
var $ = require('jquery');
var OnboardingView = require('../layer-onboarding-view');
var template = require('./analysis-onboarding.tpl');

module.exports = OnboardingView.extend({
  events: OnboardingView.extendEvents({
    'click .js-add-analysis': '_onAddAnalysisClicked'
  }),

  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: 1,
      modifier: '--analysis'
    }));
  },

  _onAddAnalysisClicked: function () {
    this.clean();
    $('.js-add-analysis').click();
  }
});
