var BuilderOnboardingView = require('./builder-view');

var BUILDER_KEY = 'onboarding';

var launcher = (function () {
  var onboardings;
  var userModel;
  var configModel;
  var onboardingNotification;
  var layerDefinitionsCollection;
  var editorModel;

  function init (opts) {
    if (!onboardings && !opts) {
      throw new Error('onboardings is required');
    }
    if (!userModel && !opts) {
      throw new Error('userModel is required');
    }
    if (!configModel && !opts) {
      throw new Error('configModel is required');
    }
    if (!onboardingNotification && !opts) {
      throw new Error('onboardingNotification is required');
    }
    if (!layerDefinitionsCollection && !opts) {
      throw new Error('layerDefinitionsCollection is required');
    }

    if (!onboardings && opts && opts.onboardings) {
      onboardings = opts.onboardings;
    }
    if (!userModel && opts && opts.userModel) {
      userModel = opts.userModel;
    }
    if (!configModel && opts && opts.configModel) {
      configModel = opts.configModel;
    }
    if (!onboardingNotification && opts && opts.onboardingNotification) {
      onboardingNotification = opts.onboardingNotification;
    }
    if (!layerDefinitionsCollection && opts && opts.layerDefinitionsCollection) {
      layerDefinitionsCollection = opts.layerDefinitionsCollection;
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
            onboardingNotification: onboardingNotification,
            layerDefinitionsCollection: layerDefinitionsCollection,
            configModel: configModel
          });
        });
      } else {

      }
    }
  };
})();

module.exports = launcher;
