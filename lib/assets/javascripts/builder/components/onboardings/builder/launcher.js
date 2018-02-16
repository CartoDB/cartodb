var BuilderOnboardingView = require('./builder-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var BUILDER_KEY = 'onboarding';

var REQUIRED_OPTS = [
  'onboardings',
  'userModel',
  'onboardingNotification',
  'editorModel'
];

module.exports = (function () {
  return {
    init: function (opts) {
      checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    },

    launch: function () {
      if (!this._onboardingNotification.getKey(BUILDER_KEY)) {
        this._onboardings.create(function () {
          return new BuilderOnboardingView({
            userModel: this._userModel,
            editorModel: this._editorModel,
            onboardingNotification: this._onboardingNotification
          });
        }.bind(this));
      }
    }
  };
})();
