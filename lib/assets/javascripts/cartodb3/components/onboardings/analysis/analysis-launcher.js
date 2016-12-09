var LocalStorage = require('../../../components/local-storage/local-storage');
var AnalysisOnboardingView = require('../../../components/onboardings/analysis/analysis-view');
var Analyses = require('../../../data/analyses');
var STORAGE_KEY = 'onboarding';

var launcher = (function () {
  var onboardings;
  var userModel;
  var editorModel;

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

    editorModel = onboardings.editorModel;
  }

  return {
    init: function (opts) {
      init(opts);

      LocalStorage.init(STORAGE_KEY, {
        userModel: userModel
      });
    },

    launch: function (type, model) {
      var genericType = Analyses.getAnalysisByType(type).genericType || type;

      if (!LocalStorage.get(genericType) && genericType) {
        onboardings.create(function (modalModel) {
          return new AnalysisOnboardingView({
            modalModel: modalModel,
            userModel: userModel,
            editorModel: editorModel,
            model: model
          });
        });
      }
    }
  };
})();

module.exports = launcher;
