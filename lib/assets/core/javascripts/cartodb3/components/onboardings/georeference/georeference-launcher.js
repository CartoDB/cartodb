var GeoreferenceOnboardingView = require('./georeference-view');
var GEOREFERENCE_KEY = 'georeference';

var GeoreferenceOnboardingLauncher = function (launcherOpts) {
  var _onboardingNotification;
  var _onboardings;

  if (!launcherOpts || !launcherOpts.onboardingNotification) {
    throw new Error('onboardingNotification is required');
  }
  if (!launcherOpts || !launcherOpts.onboardings) {
    throw new Error('onboardings is required');
  }

  _onboardingNotification = launcherOpts.onboardingNotification;
  _onboardings = launcherOpts.onboardings;

  return {
    launch: function (launchOpts) {
      if (!_onboardingNotification.getKey(GEOREFERENCE_KEY)) {
        _onboardings.create(function () {
          return new GeoreferenceOnboardingView({
            onboardingNotification: _onboardingNotification,
            name: launchOpts.name,
            source: launchOpts.source,
            notificationKey: GEOREFERENCE_KEY
          });
        });
      }
    }
  };
};

module.exports = GeoreferenceOnboardingLauncher;
