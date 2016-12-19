var BuilderOnboardingView = require('../../../components/onboardings/builder/builder-view');

var BUILDER_KEY = 'onboarding';

var launcher = (function () {
  var onboardings;
  var userModel;
  var onboardingNotification;
  var editorModel;

  function init (opts) {
    if (!onboardings && !opts) {
      throw new Error('onboardings is required');
    }

    if (!userModel && !opts) {
      throw new Error('userModel is required');
    }

    if (!onboardingNotification && !opts) {
      throw new Error('onboardingNotification is required');
    }

    if (!onboardings && opts && opts.onboardings) {
      onboardings = opts.onboardings;
    }

    if (!userModel && opts && opts.userModel) {
      userModel = opts.userModel;
    }
    if (!onboardingNotification && opts && opts.onboardingNotification) {
      onboardingNotification = opts.onboardingNotification;
    }

    editorModel = onboardings.editorModel;
  }

  return {
    init: function (opts) {
      init(opts);
    },

    launch: function () {
      if (!onboardingNotification.getKey(BUILDER_KEY)) {
        onboardings.create(function (modalModel) {
          return new BuilderOnboardingView({
            modalModel: modalModel,
            userModel: userModel,
            editorModel: editorModel,
            onboardingNotification: onboardingNotification
          });
        });
      }
    }
  };
})();

module.exports = launcher;
