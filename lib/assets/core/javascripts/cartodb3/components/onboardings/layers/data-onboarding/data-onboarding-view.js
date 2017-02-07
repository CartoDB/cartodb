var _ = require('underscore');
var OnboardingView = require('../layer-onboarding-view');
var template = require('./data-onboarding.tpl');

var NOTIFICATION_KEY = 'DATA-ONBOARDING';

module.exports = OnboardingView.extend({

  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      notificationKey: NOTIFICATION_KEY,
      numberOfSteps: 4,
      modifier: '--data'
    }));
    if (opts.hasWidgets === void 0) {
      throw new Error('hasWidgets is required.');
    }
    this._hasWidgets = opts.hasWidgets;
  },

  render: function () {
    this.$el.html(this._template({
      hasWidgets: this._hasWidgets
    }));

    return this;
  }
});
