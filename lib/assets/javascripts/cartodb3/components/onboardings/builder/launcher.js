var BuilderOnboardingView = require('../../../components/onboardings/builder/builder-view');

var BUILDER_KEY = 'onboarding';

var launcher = (function () {
  var onboardings;
  var userModel;
  var userNotifications;

  function init (opts) {
    if (!onboardings && !opts) {
      throw new Error('onboardings is required');
    }

    if (!userModel && !opts) {
      throw new Error('userModel is required');
    }

    if (!userNotifications && !opts) {
      throw new Error('userNotifications is required');
    }

    if (!onboardings && opts && opts.onboardings) {
      onboardings = opts.onboardings;
    }

    if (!userModel && opts && opts.userModel) {
      userModel = opts.userModel;
    }
    if (!userNotifications && opts && opts.userNotifications) {
      userNotifications = opts.userNotifications;
    }
  }

  return {
    init: function (opts) {
      init(opts);
    },

    launch: function () {
      if (!userNotifications.getKey(BUILDER_KEY)) {
        onboardings.create(function (modalModel) {
          return new BuilderOnboardingView({
            modalModel: modalModel,
            userModel: userModel,
            userNotifications: userNotifications
          });
        });
      }
    }
  };
})();

module.exports = launcher;
