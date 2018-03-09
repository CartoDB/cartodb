var LocalStorage = require('builder/components/local-storage/local-storage');
var AnalysisOnboardingView = require('builder/components/onboardings/analysis/analysis-view');
var Analyses = require('builder/data/analyses');

var BASE_STORAGE_KEY = 'onboarding';

var launcher = (function () {
  var onboardings;
  var userModel;
  var editorModel;
  var visDefinitionModel;

  function init (opts) {
    if (!onboardings && !opts) {
      throw new Error('onboardings is required');
    }

    if (!userModel && !opts) {
      throw new Error('userModel is required');
    }

    if (!visDefinitionModel && !opts) {
      throw new Error('visDefinitionModel is required');
    }

    if (!onboardings && opts && opts.onboardings) {
      onboardings = opts.onboardings;
    }

    if (!userModel && opts && opts.userModel) {
      userModel = opts.userModel;
    }

    if (!visDefinitionModel && opts && opts.visDefinitionModel) {
      visDefinitionModel = opts.visDefinitionModel;
    }

    editorModel = onboardings.editorModel;
  }

  return {
    init: function (opts) {
      init(opts);

      var storageKey = BASE_STORAGE_KEY + '.' + visDefinitionModel.get('id');

      LocalStorage.init(storageKey, {
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
            model: model,
            visDefinitionModel: visDefinitionModel
          });
        });
      }
    }
  };
})();

module.exports = launcher;
