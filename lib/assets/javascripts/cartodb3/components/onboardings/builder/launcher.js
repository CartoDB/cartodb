var LocalStorage = require('../../../components/local-storage/local-storage');
var BuilderOnboardingView = require('../../../components/onboardings/builder/builder-view');

var STORAGE_KEY = 'builder';
var BUILDER_KEY = 'welcome';

var launcher = (function () {
  var onboardings;
  var userModel;

  function init (opts) {
    if (!onboardings && !opts) {
      throw new Error('onboardings is required');
    }

    if (!userModel && !opts) {
      throw new Error('userModel is required');
    }

    if (!onboardings && opts && opts.onboardings) {
      onboardings = opts.onboardings;
    }

    if (!userModel && opts && opts.userModel) {
      userModel = opts.userModel;
    }
  }

  return {
    init: function (opts) {
      init(opts);

      LocalStorage.init(STORAGE_KEY, {
        userModel: userModel
      });
    },

    launch: function () {
      if (!LocalStorage.get(BUILDER_KEY)) {
        onboardings.create(function (modalModel) {
          return new BuilderOnboardingView({
            modalModel: modalModel,
            userModel: userModel
          });
        });
      }
    }
  };
})();

module.exports = launcher;
