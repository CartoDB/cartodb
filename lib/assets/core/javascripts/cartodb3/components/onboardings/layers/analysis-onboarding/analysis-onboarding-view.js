var _ = require('underscore');
var $ = require('jquery');
var OnboardingView = require('../onboarding-view');
var template = require('./analysis-onboarding.tpl');

var NOTIFICATION_KEY = 'ANALYSIS-ONBOARDING';

module.exports = OnboardingView.extend({
  events: OnboardingView.extendEvents({
    'click .js-add-analysis': '_onAddAnalysisClicked'
  }),

  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      notificationKey: NOTIFICATION_KEY,
      numberOfSteps: 1
    }));
  },

  _onAddAnalysisClicked: function () {
    this.clean();
    $('.js-add-analysis').click();
  }
});
