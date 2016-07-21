var LocalStorage = require('../../../components/local-storage/local-storage');
var AnalysisOnboardingView = require('../../../components/onboardings/analysis/analysis-view');

var STORAGE_KEY = 'onboarding';

var ANALYSES_TYPES = require('./analyses-types');

var TYPE_TO_META_MAP = {};

ANALYSES_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

var launcher = (function () {
  var initialized = false;
  var onboardings;
  var userModel;

  function init (opts) {
    if (!onboardings && !opts) {
      throw new Error('onboardings is required');
    }

    if (!onboardings && opts && opts.onboardings) {
      onboardings = opts.onboardings;
    }

    if (!userModel && !opts) {
      throw new Error('userModel is required');
    }

    if (!userModel && opts && opts.userModel) {
      userModel = opts.userModel;
    }

    initialized = true;
  }

  function typeDef (type) {
    return TYPE_TO_META_MAP[type];
  }

  return {
    init: function (opts) {
      init(opts);

      LocalStorage.init(STORAGE_KEY, {
        userModel: userModel
      });
    },

    launch: function (type, model) {
      console.log(type);
      if (!LocalStorage.get(type) && typeDef(type)) {
        onboardings.create(function (modalModel) {
          return new AnalysisOnboardingView({
            modalModel: modalModel,
            userModel: userModel,
            model: model
          });
        });
      }
    }
  };
})();

module.exports = launcher;
