var GeoreferenceOnboardingView = require('./georeference-view');

var GEOREFERENCE_KEY = 'georeference';

var launcher = (function () {
  var onboardings;
  var onboardingNotification;

  function init (opts) {
    if (!onboardings && !opts) {
      throw new Error('onboardings is required');
    }

    if (!onboardingNotification && !opts) {
      throw new Error('onboardingNotification is required');
    }

    if (!onboardings && opts && opts.onboardings) {
      onboardings = opts.onboardings;
    }

    if (!onboardingNotification && opts && opts.onboardingNotification) {
      onboardingNotification = opts.onboardingNotification;
    }
  }

  return {
    init: function (opts) {
      init(opts);
    },

    launch: function (launchOpts) {
      if (!onboardingNotification.getKey(GEOREFERENCE_KEY)) {
        onboardings.create(function () {
          return new GeoreferenceOnboardingView({
            onboardingNotification: onboardingNotification,
            name: launchOpts.name,
            source: launchOpts.source
          });
        });
      }
    }
  };
})();

module.exports = launcher;
