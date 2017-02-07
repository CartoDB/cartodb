var DataOnboardingView = require('./data-onboarding-view');

var BUILDER_KEY = 'onboarding';

var launcher = (function () {
  var onboardings;
  var userModel;
  var onboardingNotification;
  var editorModel;
  var hasWidgets;

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

    if (!opts || opts.hasWidgets === void 0) {
      throw new Error('hasWidgets is required');
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

    if (opts && opts.hasWidgets !== void 0) {
      hasWidgets = opts.hasWidgets;
    }

    editorModel = onboardings.editorModel;
  }

  return {
    init: function (opts) {
      init(opts);
    },

    launch: function () {
      // if (!onboardingNotification.getKey(BUILDER_KEY)) {
        onboardings.create(function () {
          return new DataOnboardingView({
            editorModel: editorModel,
            onboardingNotification: onboardingNotification,
            hasWidgets: hasWidgets
          });
        });
      // }
    }
  };
})();

module.exports = launcher;
