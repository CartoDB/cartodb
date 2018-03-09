var _ = require('underscore');

var GenericOnboardingLauncher = function (launcherOpts, viewOpts) {
  var _view;
  var _onboardingNotification;
  var _notificationKey;
  var _onboardings;
  var _viewOpts;

  if (!launcherOpts || !launcherOpts.view) {
    throw new Error('view is required');
  }

  if (!launcherOpts.onboardingNotification) {
    throw new Error('onboardingNotification is required');
  }

  if (!launcherOpts.notificationKey) {
    throw new Error('notificationKey is required');
  }

  if (!launcherOpts.onboardings) {
    throw new Error('onboardings is required');
  }

  if (!viewOpts) {
    throw new Error('viewOpts is required');
  }

  _view = launcherOpts.view;
  _onboardingNotification = launcherOpts.onboardingNotification;
  _notificationKey = launcherOpts.notificationKey;
  _onboardings = launcherOpts.onboardings;
  _viewOpts = viewOpts;

  return {
    launch: function (launchOpts) {
      if (!_onboardingNotification.getKey(_notificationKey)) {
        _onboardings.create(function () {
          var extendedViewOptions = _.extend(_viewOpts, {
            onboardingNotification: _onboardingNotification,
            notificationKey: _notificationKey
          });
          return new _view(_.extend(extendedViewOptions, launchOpts));
        });
      }
    }
  };
};

module.exports = GenericOnboardingLauncher;
